import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type { Family, FamilyInvitation, FamilyMember, Relationship, WithId } from "../types/models";
import { isInvitationExpired } from "../utils/invitations";
import { validateInviteContact, validateMemberName } from "../utils/validation";

// ONE backend for family + members. Every screen that shows or edits family members
// (Shared Expenses > Family members, Family Budget, and later Manage Group) must go
// through this service and the FamilyContext built on it. Do not add a second member
// model, collection or invitation flow.
//
//   families/{familyId}
//   families/{familyId}/members/{memberId}
//   familyInvitations/{lowercasedEmail}     (one per email; linked when that email registers)
//
// NOTE: an invitation is only consumed when the invited email REGISTERS a new account.
// Someone who already has an account is not linked by it (accept-on-login is not built).
// An invitation can be claimed for 30 days (utils/invitations.ts); inviting the same email again
// after that renews it.

export type FamilyEvent =
  | { status: "ready"; family: WithId<Family> }
  | { status: "missing" }
  | { status: "error"; error: unknown };

export type MembersEvent =
  | { status: "ready"; members: WithId<FamilyMember>[] }
  | { status: "error"; error: unknown };

/** Live listener on families/{familyId}. Returns the unsubscribe function. */
export function subscribeToFamily(familyId: string, onEvent: (e: FamilyEvent) => void): () => void {
  return onSnapshot(
    doc(db, "families", familyId),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) {
        const data = snap.data({ serverTimestamps: "estimate" }) as Family;
        onEvent({ status: "ready", family: { id: snap.id, ...data } });
      } else if (!snap.metadata.fromCache) {
        // Only the server can confirm the family is really gone.
        onEvent({ status: "missing" });
      }
    },
    (error) => onEvent({ status: "error", error }),
  );
}

/**
 * Live listener on the family's members. Returns the unsubscribe function.
 * A family always has at least its admin, so an EMPTY answer served from the local cache
 * is "not loaded yet" and is not reported.
 */
export function subscribeToMembers(familyId: string, onEvent: (e: MembersEvent) => void): () => void {
  return onSnapshot(
    collection(db, "families", familyId, "members"),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.empty && snap.metadata.fromCache) return;
      const members = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data({ serverTimestamps: "estimate" }) as FamilyMember),
      }));
      onEvent({ status: "ready", members });
    },
    (error) => onEvent({ status: "error", error }),
  );
}

// ------------------------------------------------------------------------------------
// Invitations
// ------------------------------------------------------------------------------------

export type InviteErrorCode =
  | "not-admin"
  | "invalid-name"
  | "invalid-email"
  | "own-email"
  | "already-in-family"
  | "already-invited"
  | "rejected"
  | "unknown";

export class InviteError extends Error {
  readonly code: InviteErrorCode;

  constructor(code: InviteErrorCode, message: string) {
    super(message);
    Object.setPrototypeOf(this, InviteError.prototype);
    this.name = "InviteError";
    this.code = code;
  }
}

export type InviteInput = {
  familyId: string;
  /** uid of the person inviting (must be the family admin). */
  invitedByUid: string;
  /** The inviter's own email, so they cannot invite themselves. */
  invitedByEmail: string | null;
  /** Whether the caller is the family admin (the rules enforce this regardless). */
  isAdmin: boolean;
  /** The family's current members, used to catch duplicates before writing. */
  existingMembers: WithId<FamilyMember>[];
  name: string;
  relationship: Relationship;
  /** Raw text from the "email or phone" field. */
  contact: string;
  canAddExpenses: boolean;
};

export const normalizeInviteEmail = (value: string) => value.trim().toLowerCase();

/**
 * Creates a pending member AND its invitation in ONE atomic batch: either both exist or
 * neither does. The memberId is created here and kept when the invited person later
 * registers (their registration only activates this same member).
 */
export async function inviteFamilyMember(
  input: InviteInput,
): Promise<{ memberId: string; renewed: boolean }> {
  if (!input.isAdmin) {
    throw new InviteError("not-admin", "Only the family admin can invite members.");
  }

  const nameError = validateMemberName(input.name);
  if (nameError) throw new InviteError("invalid-name", nameError);

  const contactError = validateInviteContact(input.contact);
  if (contactError) throw new InviteError("invalid-email", contactError);

  const email = normalizeInviteEmail(input.contact);
  if (input.invitedByEmail && email === normalizeInviteEmail(input.invitedByEmail)) {
    throw new InviteError("own-email", "That's your own email address.");
  }
  const alreadyInvited = input.existingMembers.find((m) => m.inviteEmail === email);
  if (alreadyInvited) {
    // Inviting the same person again after their invitation expired renews it in place (same
    // member, same invitation document) instead of creating a duplicate.
    if (alreadyInvited.status === "pending" && (await renewExpiredInvitation(input.familyId, email, alreadyInvited.id))) {
      return { memberId: alreadyInvited.id, renewed: true };
    }
    throw new InviteError("already-in-family", "That email has already been invited to your family.");
  }

  // The rules let the family admin read an invitation of THEIR family, so an existing one
  // shows up here. (An invitation from another family, or no invitation at all, both come
  // back as permission-denied; the batch below then decides.)
  try {
    const existing = await getDoc(doc(db, "familyInvitations", email));
    if (existing.exists()) {
      throw new InviteError("already-invited", "That email already has an invitation.");
    }
  } catch (error) {
    if (error instanceof InviteError) throw error;
    // permission-denied / offline: fall through to the atomic write.
  }

  const memberRef = doc(collection(db, "families", input.familyId, "members"));
  const batch = writeBatch(db);
  batch.set(memberRef, {
    userId: null,
    displayName: input.name.trim(),
    relationship: input.relationship,
    role: "member",
    status: "pending",
    inviteEmail: email,
    canAddExpenses: input.canAddExpenses,
    joinedAt: null,
  });
  batch.set(doc(db, "familyInvitations", email), {
    familyId: input.familyId,
    memberId: memberRef.id,
    email,
    invitedBy: input.invitedByUid,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new InviteError(
        "rejected",
        "That email can't be invited. It may already have an invitation, or only the family admin can invite members.",
      );
    }
    throw new InviteError("unknown", "Couldn't send the invitation. Check your connection and try again.");
  }

  return { memberId: memberRef.id, renewed: false };
}

/**
 * Restarts the 30 days of an EXPIRED, still-pending invitation of this family for this member.
 * Only `createdAt` changes (the rules freeze everything else). Returns false when there is nothing
 * to renew (no invitation, not pending, not expired, or it belongs to another member).
 */
async function renewExpiredInvitation(familyId: string, email: string, memberId: string): Promise<boolean> {
  const ref = doc(db, "familyInvitations", email);
  let invitation: FamilyInvitation;
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    invitation = snap.data() as FamilyInvitation;
  } catch {
    return false;
  }
  if (
    invitation.familyId !== familyId ||
    invitation.memberId !== memberId ||
    invitation.status !== "pending" ||
    !isInvitationExpired(invitation.createdAt)
  ) {
    return false;
  }

  try {
    await updateDoc(ref, { createdAt: serverTimestamp() });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new InviteError("rejected", "That invitation can't be renewed right now.");
    }
    throw new InviteError("unknown", "Couldn't renew the invitation. Check your connection and try again.");
  }
  return true;
}

export function getInviteErrorMessage(error: unknown): string {
  if (error instanceof InviteError) return error.message;
  return "Something went wrong. Please try again.";
}
