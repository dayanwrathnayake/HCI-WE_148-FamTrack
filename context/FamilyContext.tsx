import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  InviteError,
  inviteFamilyMember,
  subscribeToFamily,
  subscribeToMembers,
} from "../services/familyService";
import type { Family, Relationship, WithId } from "../types/models";
import { isActiveMember, isPendingMember, sortMembers, type MemberRecord } from "../utils/members";
import { useAuth } from "./AuthContext";

// The ONE source of truth for the signed-in user's family and its members:
//   Firestore families/{id} + families/{id}/members  ->  familyService  ->  this context
// Shared Expenses, Family Budget and (later) Manage Group must all read from here.

/**
 * idle     - not signed in
 * loading  - waiting for the profile, the family or the member list
 * ready    - family and members loaded
 * missing  - signed in but there is no family document to show
 * error    - a listener failed
 */
export type FamilyStatus = "idle" | "loading" | "ready" | "missing" | "error";

type InviteMemberInput = {
  name: string;
  relationship: Relationship;
  /** Raw "email or phone" text. Only emails are supported. */
  contact: string;
  canAddExpenses: boolean;
};

type FamilyContextValue = {
  status: FamilyStatus;
  family: WithId<Family> | null;
  /** Everyone, ordered: admin, then active members, then pending invitations. */
  members: MemberRecord[];
  activeMembers: MemberRecord[];
  pendingMembers: MemberRecord[];
  /** The signed-in user's own member document. */
  currentMember: MemberRecord | null;
  /** True only for an ACTIVE member whose role is admin. False while loading. */
  isAdmin: boolean;
  /** Creates a pending member + invitation atomically. Throws InviteError. */
  inviteMember: (input: InviteMemberInput) => Promise<{ memberId: string }>;
  retryFamily: () => void;
};

type Loaded = {
  key: string | null;
  family: WithId<Family> | null;
  familyState: "loading" | "ready" | "missing" | "error";
  members: MemberRecord[];
  membersState: "loading" | "ready" | "error";
};

const EMPTY: Loaded = {
  key: null,
  family: null,
  familyState: "loading",
  members: [],
  membersState: "loading",
};

const FamilyContext = createContext<FamilyContextValue | undefined>(undefined);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, profile, profileStatus, isSignedIn } = useAuth();

  const uid = isSignedIn && user ? user.uid : null;
  const familyId = uid && profileStatus === "ready" ? (profile?.familyId ?? null) : null;
  // Everything loaded below belongs to exactly one (user, family) pair.
  const key = uid && familyId ? `${uid}:${familyId}` : null;

  const [loaded, setLoaded] = useState<Loaded>(EMPTY);
  const [familyAttempt, setFamilyAttempt] = useState(0);
  const retryFamily = useCallback(() => setFamilyAttempt(attempt => attempt + 1), []);

  useEffect(() => {
    if (!key || !familyId) {
      setLoaded(EMPTY);
      return;
    }

    setLoaded({ ...EMPTY, key });
    const unsubscribeFamily = subscribeToFamily(familyId, (event) => {
      setLoaded((prev) => {
        if (prev.key !== key) return prev; // a newer user/family is already active
        if (event.status === "ready") return { ...prev, family: event.family, familyState: "ready" };
        if (event.status === "missing") return { ...prev, family: null, familyState: "missing" };
        console.warn("[family] family listener failed", event.error);
        return { ...prev, family: null, familyState: "error" };
      });
    });
    const unsubscribeMembers = subscribeToMembers(familyId, (event) => {
      setLoaded((prev) => {
        if (prev.key !== key) return prev;
        if (event.status === "ready") {
          return { ...prev, members: sortMembers(event.members), membersState: "ready" };
        }
        console.warn("[family] members listener failed", event.error);
        return { ...prev, members: [], membersState: "error" };
      });
    });

    return () => {
      unsubscribeFamily();
      unsubscribeMembers();
    };
  }, [key, familyId, familyAttempt]);

  // Only data that belongs to the CURRENT user+family is exposed, so a previous account's
  // family can never appear, not even for one render while switching accounts.
  const current = loaded.key === key ? loaded : EMPTY;

  const status: FamilyStatus = useMemo(() => {
    if (!uid) return "idle";
    if (profileStatus === "loading") return "loading";
    if (profileStatus !== "ready" || !familyId) return "missing";
    if (current.familyState === "error" || current.membersState === "error") return "error";
    if (current.familyState === "missing") return "missing";
    if (current.familyState === "ready" && current.membersState === "ready") return "ready";
    return "loading";
  }, [uid, profileStatus, familyId, current]);

  const members = current.members;
  const activeMembers = useMemo(() => members.filter(isActiveMember), [members]);
  const pendingMembers = useMemo(() => members.filter(isPendingMember), [members]);
  const currentMember = useMemo(
    () => (uid ? (members.find((m) => m.userId === uid) ?? null) : null),
    [members, uid],
  );
  const isAdmin = currentMember?.role === "admin" && currentMember.status === "active";

  const inviteMember = useCallback(
    async (input: InviteMemberInput) => {
      if (!uid || !familyId) {
        throw new InviteError("unknown", "Your family hasn't loaded yet. Please try again.");
      }
      return inviteFamilyMember({
        familyId,
        invitedByUid: uid,
        invitedByEmail: user?.email ?? null,
        isAdmin,
        existingMembers: members,
        ...input,
      });
    },
    [uid, familyId, user?.email, isAdmin, members],
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      status,
      family: current.family,
      members,
      activeMembers,
      pendingMembers,
      currentMember,
      isAdmin,
      inviteMember,
      retryFamily,
    }),
    [status, current.family, members, activeMembers, pendingMembers, currentMember, isAdmin, inviteMember, retryFamily],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const value = useContext(FamilyContext);
  if (!value) {
    throw new Error("useFamily must be used inside <FamilyProvider>");
  }
  return value;
}
