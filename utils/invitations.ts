// An invitation can be claimed for 30 days after it was issued. `createdAt` is when the CURRENT
// invitation was issued: renewing an expired invitation resets it. Invitations written before
// expiry existed have the same `createdAt`, so they follow the same rule without any migration.
// Keep in sync with invitationExpired() in firestore.rules, which is what actually enforces it.

export const INVITATION_VALID_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True when the invitation can no longer be claimed. A missing `createdAt` is a write that the
 * server has not stamped yet (so it was just made), which is not expired.
 */
export function isInvitationExpired(
  createdAt: { toMillis(): number } | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!createdAt) return false;
  return now >= createdAt.toMillis() + INVITATION_VALID_DAYS * DAY_MS;
}
