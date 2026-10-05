import { getUserProfile } from "./userService";

export const RESTORE_CHECK_TIMEOUT_MS = 4000;

/**
 * Decides whether a session restored at app launch may stay signed in.
 *
 * Returns false ONLY when the profile read succeeded and users/{uid} is confirmed missing.
 * A failed read (offline, permissions, anything else) or a timeout returns true, so a
 * returning user without connectivity is never signed out by mistake.
 */
export async function isRestoredSessionValid(
  uid: string,
  readProfile: (uid: string) => Promise<unknown | null> = getUserProfile,
  timeoutMs: number = RESTORE_CHECK_TIMEOUT_MS,
): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const profile = await Promise.race([
      readProfile(uid),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("profile check timed out")), timeoutMs);
      }),
    ]);
    return profile !== null;
  } catch {
    return true;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
