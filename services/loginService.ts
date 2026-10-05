import { getAuthErrorMessage, sendPasswordReset, signInWithEmail, signOutUser } from "./authService";
import { getUserProfile } from "./userService";

// Login is read-only with respect to Firestore: it checks that users/{uid} exists but
// NEVER creates a profile, family or member. An Auth account without a profile is
// signed out again and reported, not repaired.

export const PASSWORD_RESET_NOTICE = "If an account exists for that email, we've sent a reset link.";

export type LoginErrorCode = "profile-missing" | "profile-unavailable";

const LOGIN_ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  "profile-missing":
    "Your account setup is incomplete. Please try registering again or contact support.",
  "profile-unavailable":
    "We couldn't load your profile. Check your connection and try again.",
};

export class LoginError extends Error {
  readonly code: LoginErrorCode;

  constructor(code: LoginErrorCode) {
    super(LOGIN_ERROR_MESSAGES[code]);
    Object.setPrototypeOf(this, LoginError.prototype);
    this.name = "LoginError";
    this.code = code;
  }
}

export type LoginResult = {
  uid: string;
  familyId: string | null;
};

async function signOutQuietly(): Promise<void> {
  try {
    await signOutUser();
  } catch (error) {
    console.warn("[login] sign-out after a failed profile check also failed", error);
  }
}

/**
 * Signs in, then confirms the user's profile exists. Throws the original Firebase Auth
 * error if sign-in fails, or a LoginError (after signing out) if the profile is missing
 * or cannot be safely loaded. Resolves only when both checks pass.
 */
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const user = await signInWithEmail(email, password);

  let profile;
  try {
    profile = await getUserProfile(user.uid);
  } catch (error) {
    console.warn("[login] could not read the user profile", error);
    await signOutQuietly();
    throw new LoginError("profile-unavailable");
  }

  if (!profile) {
    await signOutQuietly();
    throw new LoginError("profile-missing");
  }

  return { uid: user.uid, familyId: profile.familyId };
}

/**
 * Sends a password reset email. "No account for this email" is treated as success so the
 * app never reveals which addresses are registered; other failures are rethrown.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordReset(email);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "auth/user-not-found") return;
    throw error;
  }
}

/** A message that is safe to show on the Login screen for any error from loginUser. */
export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof LoginError) return error.message;
  return getAuthErrorMessage(error);
}
