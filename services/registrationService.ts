import type { User } from "firebase/auth";
import { collection, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";

import { db } from "../lib/firebase";
import type { FamilyInvitation, FamilyMember } from "../types/models";
import { deleteAuthUser, getAuthErrorMessage, signOutUser, signUpWithEmail } from "./authService";

// Registration = create the Auth user, then write the Firestore profile in ONE atomic
// batch. Two outcomes:
//   - the email has a pending invitation -> link the user to that existing family
//   - otherwise                          -> create their first family and make them Admin
//
// NOTE: invitations are matched by email and emails are not verified (see firestore.rules),
// so whoever registers first with an invited address takes the invitation.

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type RegistrationResult = {
  uid: string;
  familyId: string;
  joinedViaInvitation: boolean;
};

export class RegistrationError extends Error {
  /** True when rolling back the new Auth user also failed. */
  readonly cleanupFailed: boolean;
  readonly cause: unknown;

  constructor(cause: unknown, cleanupFailed: boolean) {
    super(
      cleanupFailed
        ? "We couldn't finish setting up your account, and we couldn't undo it. Try logging in instead, or contact the app admin."
        : "We couldn't finish setting up your account. Please try again.",
    );
    Object.setPrototypeOf(this, RegistrationError.prototype);
    this.name = "RegistrationError";
    this.cause = cause;
    this.cleanupFailed = cleanupFailed;
  }
}

/** "Kamal Perera" -> "Perera Family"; "Kamal" -> "Kamal's Family". */
export function defaultFamilyName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[parts.length - 1]} Family` : `${parts[0]}'s Family`;
}

type PendingInvite = { familyId: string; memberId: string };

async function findPendingInvite(email: string): Promise<PendingInvite | null> {
  const invitationSnap = await getDoc(doc(db, "familyInvitations", email));
  if (!invitationSnap.exists()) return null;
  const invitation = invitationSnap.data() as FamilyInvitation;
  if (invitation.status !== "pending") return null;

  // Make sure the member the invite points at still exists and is still waiting.
  const memberSnap = await getDoc(
    doc(db, "families", invitation.familyId, "members", invitation.memberId),
  );
  if (!memberSnap.exists()) return null;
  const member = memberSnap.data() as FamilyMember;
  if (member.status !== "pending" || member.inviteEmail !== email) return null;

  return { familyId: invitation.familyId, memberId: invitation.memberId };
}

/**
 * Writes the Firestore side of registration for an already-created Auth user.
 * Everything is committed in a single batch: either all of it lands or none of it.
 */
export async function completeRegistration(
  user: User,
  fullName: string,
): Promise<RegistrationResult> {
  const email = user.email?.trim().toLowerCase();
  if (!email) throw new Error("The new account has no email address.");
  const name = fullName.trim();

  const invite = await findPendingInvite(email);
  const batch = writeBatch(db);
  const userRef = doc(db, "users", user.uid);

  if (invite) {
    batch.set(userRef, {
      name,
      email,
      familyId: invite.familyId,
      createdAt: serverTimestamp(),
    });
    // Activate the existing member in place so its memberId (and anything that
    // already references it) stays the same. Only these three fields may change.
    batch.update(doc(db, "families", invite.familyId, "members", invite.memberId), {
      userId: user.uid,
      status: "active",
      joinedAt: serverTimestamp(),
    });
    batch.update(doc(db, "familyInvitations", email), { status: "accepted" });
    await batch.commit();
    return { uid: user.uid, familyId: invite.familyId, joinedViaInvitation: true };
  }

  const familyRef = doc(collection(db, "families"));
  batch.set(userRef, {
    name,
    email,
    familyId: familyRef.id,
    createdAt: serverTimestamp(),
  });
  batch.set(familyRef, {
    name: defaultFamilyName(name),
    ownerId: user.uid,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, "families", familyRef.id, "members", user.uid), {
    userId: user.uid,
    displayName: name,
    relationship: "Other",
    role: "admin",
    status: "active",
    inviteEmail: null,
    canAddExpenses: true,
    joinedAt: serverTimestamp(),
  });
  await batch.commit();
  return { uid: user.uid, familyId: familyRef.id, joinedViaInvitation: false };
}

/** Returns true if the rollback FAILED. */
async function rollbackAuthUser(user: User): Promise<boolean> {
  try {
    await deleteAuthUser(user);
    return false;
  } catch (cleanupError) {
    console.warn("[registration] could not delete the new Auth user", cleanupError);
    // Don't leave the app signed in to an account with no profile.
    try {
      await signOutUser();
    } catch {
      // nothing else we can do
    }
    return true;
  }
}

/**
 * Full registration. Throws the original Firebase Auth error if the account could not be
 * created (nothing to roll back), or a RegistrationError if the Firestore step failed
 * (after attempting to delete the new Auth user).
 */
export async function registerUser(input: RegisterInput): Promise<RegistrationResult> {
  const user = await signUpWithEmail(input.email, input.password);
  try {
    return await completeRegistration(user, input.name);
  } catch (error) {
    console.warn("[registration] profile setup failed, rolling back", error);
    throw new RegistrationError(error, await rollbackAuthUser(user));
  }
}

/** A message that is safe to show on the Register screen for any error from registerUser. */
export function getRegistrationErrorMessage(error: unknown): string {
  if (error instanceof RegistrationError) return error.message;
  return getAuthErrorMessage(error);
}
