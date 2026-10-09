import type { FamilyMember, WithId } from "../types/models";

// Display helpers for family members. Pure functions so every screen shows members the same way.

export type MemberRecord = WithId<FamilyMember>;

type AvatarPalette = { background: string; text: string; progress: string };

// The colour pairs already used by the Family Budget / Shared Expenses designs.
const AVATAR_PALETTE: AvatarPalette[] = [
  { background: "#ffd8a8", text: "#7a4b00", progress: "#00c46a" },
  { background: "#cde3ff", text: "#1b4c88", progress: "#4b8df8" },
  { background: "#ffcfe0", text: "#8c2453", progress: "#f2789b" },
];

/** Stable colours per member id, so a member keeps the same colour everywhere and across launches. */
export function getAvatarPalette(memberId: string): AvatarPalette {
  let hash = 0;
  for (let i = 0; i < memberId.length; i += 1) {
    hash = (hash * 31 + memberId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** "Kamal Perera" -> "KP", "Bob" -> "BO", "" -> "?". */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters =
    words.length === 1
      ? Array.from(words[0]).slice(0, 2).join("")
      : Array.from(words[0])[0] + Array.from(words[words.length - 1])[0];
  return letters.toUpperCase();
}

export const isPendingMember = (member: MemberRecord) => member.status === "pending";
export const isActiveMember = (member: MemberRecord) => member.status === "active";

export const getRoleLabel = (member: MemberRecord) => (member.role === "admin" ? "Admin" : "Member");

/**
 * Admin first, then other active members (earliest joined first), then pending invitations.
 * Ties fall back to the display name so the order is stable.
 */
export function sortMembers(members: MemberRecord[]): MemberRecord[] {
  const rank = (m: MemberRecord) => (m.status === "pending" ? 2 : m.role === "admin" ? 0 : 1);
  const joined = (m: MemberRecord) => (m.joinedAt ? m.joinedAt.toMillis() : Number.MAX_SAFE_INTEGER);
  return [...members].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      joined(a) - joined(b) ||
      a.displayName.localeCompare(b.displayName),
  );
}

/** Subtitle under a member's name, with the number of shared expenses they paid this month. */
export function getMemberSubtitle(member: MemberRecord, isCurrentUser: boolean, expenseCount = 0): string {
  if (isPendingMember(member)) return `${member.relationship} · Invitation pending`;
  const expenses = `${expenseCount} ${expenseCount === 1 ? "expense" : "expenses"}`;
  return isCurrentUser ? expenses : `${member.relationship} · ${expenses}`;
}

/** "October 2026" for the given date (device locale-independent, English month names). */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export function getMonthYearLabel(date: Date = new Date()): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}
