import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export type SavingGoalDoc = {
  id?: string;
  familyId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  iconEmoji: string;
  iconBg: string;
  contributors: string[];
  targetDate?: string | null;
  note?: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
};

export type CreateSavingGoalInput = {
  familyId: string;
  title: string;
  targetAmount: number;
  initialDeposit?: number;
  iconEmoji: string;
  iconBg: string;
  contributors: string[];
  targetDate?: string;
  note?: string;
  createdBy: string;
};

export async function createSavingGoal(
  input: CreateSavingGoalInput,
): Promise<string> {
  const goalData = {
    familyId: input.familyId,
    title: input.title.trim(),
    targetAmount: Math.max(0, Math.round(Number(input.targetAmount))),
    savedAmount: Math.max(0, Math.round(Number(input.initialDeposit || 0))),
    iconEmoji: input.iconEmoji || "🎯",
    iconBg: input.iconBg || "#e8f8f0",
    contributors:
      input.contributors.length > 0 ? input.contributors : [input.createdBy],
    targetDate: input.targetDate?.trim() || null,
    note: input.note?.trim() || null,
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "savingGoals"), goalData);
  return docRef.id;
}

export function subscribeToFamilySavingGoals(
  familyId: string,
  onUpdate: (goals: (SavingGoalDoc & { id: string })[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(db, "savingGoals"),
    where("familyId", "==", familyId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const goals = snapshot.docs.map((doc) => {
        const data = doc.data({
          serverTimestamps: "estimate",
        }) as SavingGoalDoc;
        return {
          id: doc.id,
          ...data,
        };
      });

      goals.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.createdAt?.toMillis?.() ?? 0;
        return timeB - timeA;
      });

      onUpdate(goals);
    },
    (error) => {
      console.warn("[savingsService] listener error:", error);
      onError?.(error);
    },
  );
}
