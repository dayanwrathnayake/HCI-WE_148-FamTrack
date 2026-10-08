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
import type { Expense, WithId } from "../types/models";

export type CreateExpenseInput = {
  familyId: string;
  budgetId?: string;
  categoryId: string;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  status: "Shared" | "Pending";
  createdBy: string;
  date: Date;
  note?: string;
  receiptUri?: string | null;
};

export async function createExpense(
  input: CreateExpenseInput,
): Promise<string> {
  const expenseData = {
    familyId: input.familyId,
    budgetId: input.budgetId || "default",
    categoryId: input.categoryId,
    title: input.title.trim(),
    amount: Math.round(input.amount),
    paidBy: input.paidBy,
    splitAmong: input.splitAmong,
    status: input.status,
    createdBy: input.createdBy,
    date: Timestamp.fromDate(input.date),
    createdAt: serverTimestamp(),
    note: input.note?.trim() || null,
    receiptUri: input.receiptUri || null,
  };

  const docRef = await addDoc(collection(db, "expenses"), expenseData);
  return docRef.id;
}

export function subscribeToFamilyExpenses(
  familyId: string,
  onUpdate: (expenses: WithId<Expense>[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(db, "expenses"),
    where("familyId", "==", familyId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data({ serverTimestamps: "estimate" }) as Expense),
      }));

      expenses.sort((a, b) => {
        const timeA = a.date?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.date?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
        return timeB - timeA;
      });

      onUpdate(expenses);
    },
    (error) => {
      console.warn("[expenseService] listener error:", error);
      onError?.(error);
    },
  );
}
