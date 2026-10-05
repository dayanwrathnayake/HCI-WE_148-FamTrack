import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "../lib/firebase";

// Firebase Auth only. Anything that touches Firestore (user profile, family,
// invitations) lives in its own service so the registration flow can compose them.

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return credential.user;
}

export function signOutUser(): Promise<void> {
  return signOut(auth);
}

export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, normalizeEmail(email));
}

/** Fires with the restored/current user (or null). Returns an unsubscribe function. */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/missing-password": "Please enter your password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/operation-not-allowed": "Email/password sign-in is not enabled for this app.",
};

/** Turns a Firebase Auth error into a short message that is safe to show to the user. */
export function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return AUTH_ERROR_MESSAGES[code] ?? "Something went wrong. Please try again.";
}
