import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import type { UserProfile, WithId } from "../types/models";

/**
 * Reads users/{uid}. Resolves to null when the document does not exist and
 * rejects if the read itself fails (network, permissions), so callers can tell
 * "no profile" apart from "could not check".
 */
export async function getUserProfile(uid: string): Promise<WithId<UserProfile> | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as UserProfile) };
}
