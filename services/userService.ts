import { doc, getDoc, onSnapshot } from "firebase/firestore";

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

export type UserProfileEvent =
  | { status: "ready"; profile: WithId<UserProfile> }
  | { status: "missing" }
  | { status: "error"; error: unknown };

/**
 * Live listener on users/{uid}. Returns the unsubscribe function.
 *
 * "missing" is only reported when the SERVER confirms the document does not exist. A
 * not-in-cache-yet answer (e.g. offline) is not reported at all, so callers keep showing
 * "loading" instead of wrongly concluding the profile is gone. After an "error" the
 * underlying listener is finished and does not retry.
 */
export function subscribeToUserProfile(
  uid: string,
  onEvent: (event: UserProfileEvent) => void,
): () => void {
  return onSnapshot(
    doc(db, "users", uid),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) {
        // createdAt is still pending on a brand-new document; estimate it locally.
        const data = snap.data({ serverTimestamps: "estimate" }) as UserProfile;
        onEvent({ status: "ready", profile: { id: snap.id, ...data } });
      } else if (!snap.metadata.fromCache) {
        onEvent({ status: "missing" });
      }
    },
    (error) => onEvent({ status: "error", error }),
  );
}
