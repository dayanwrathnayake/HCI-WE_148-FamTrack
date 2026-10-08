import { EmailAuthProvider, getIdToken, reauthenticateWithCredential, reload, signInWithEmailAndPassword } from "firebase/auth";
import { doc, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { deleteObject, ref, uploadBytes } from "firebase/storage";
import { auth, db, functions, storage } from "../lib/firebase";
import type { UserProfile, WithId } from "../types/models";
import { validateName } from "../utils/validation";

export async function saveAccountDetails(profile: WithId<UserProfile>, memberId: string | null, input: { name: string; phone: string; photoUri?: string; photoMime?: string }) {
  const user = auth.currentUser;
  if (!user || user.uid !== profile.id) throw new Error("Please sign in again.");
  const name = input.name.trim();
  const phone = input.phone.replace(/[\s()-]/g, "");
  const invalidName = validateName(name);
  if (invalidName) throw new Error(invalidName);
  if (phone && !/^\+?\d{7,15}$/.test(phone)) throw new Error("Enter a valid phone number.");
  let newPath: string | undefined;
  try {
    if (input.photoUri) {
      const response = await fetch(input.photoUri);
      const blob = await response.blob();
      const contentType = input.photoMime || blob.type;
      if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) throw new Error("Choose a JPEG, PNG, or WebP photo.");
      if (blob.size > 5 * 1024 * 1024) throw new Error("Choose a photo smaller than 5 MB.");
      newPath = `profilePhotos/${user.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await uploadBytes(ref(storage, newPath), blob, { contentType });
    }
    if (auth.currentUser?.uid !== user.uid) throw new Error("Your session changed. Please try again.");
    const batch = writeBatch(db);
    batch.update(doc(db, "users", user.uid), { name, phone, ...(newPath ? { photoPath: newPath } : {}) });
    if (profile.familyId && memberId) batch.update(doc(db, "families", profile.familyId, "members", memberId), { displayName: name });
    await batch.commit();
  } catch (error) {
    if (newPath) await deleteObject(ref(storage, newPath)).catch(() => undefined);
    throw error;
  }
  if (newPath && profile.photoPath && profile.photoPath !== newPath) await deleteObject(ref(storage, profile.photoPath)).catch(() => undefined);
}

export async function changeAccountEmail(email: string, password: string) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Please sign in again.");
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(normalized)) throw new Error("Enter an email ending in @gmail.com.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await getIdToken(user, true);
  const result = await httpsCallable<{ email: string }, { email: string }>(functions, "changeAccountEmail")({ email: normalized });
  await signInWithEmailAndPassword(auth, result.data.email, password);
  return result.data.email;
}

export async function syncAccountEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  await reload(user);
  await getIdToken(user, true);
  const result = await httpsCallable<undefined, { email: string }>(functions, "syncAccountEmail")();
  return result.data.email;
}

export function accountErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const messages: Record<string, string> = {
    "permission-denied": "Could not save your profile. Check that the latest Firebase rules are deployed.",
    "storage/unauthorized": "Photo upload was denied. Check that the Storage rules are deployed.",
    "storage/unknown": "Photo upload failed. Check Firebase Storage setup and try again.",
    "auth/invalid-credential": "Your current password is incorrect.",
    "auth/wrong-password": "Your current password is incorrect.",
    "auth/email-already-in-use": "That email is already used by another account.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/requires-recent-login": "Please sign in again before changing your email.",
    "auth/network-request-failed": "Check your connection and try again.",
    "auth/user-token-expired": "Your session expired. Sign in with your current email, then try again.",
    "auth/invalid-user-token": "Sign in with your current email, then try again.",
    "functions/not-found": "Email synchronization is unavailable. Deploy the account function first.",
    "functions/unavailable": "Could not confirm your email. Check your connection and Firebase Functions setup.",
    "functions/failed-precondition": "Enter your current password again to change your email.",
    "functions/already-exists": "That email is already used by another account.",
    "functions/invalid-argument": "Enter an email ending in @gmail.com.",
  };
  return messages[code] || (error instanceof Error && !code ? error.message : "Could not complete this request. Please try again.");
}
