import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  isExpenseCategoryId,
  getExpenseCategory,
} from "../constants/categories";
import { db } from "../lib/firebase";
import type {
  Budget,
  Expense,
  ExpenseCategoryId,
  ExpenseStatus,
  WithId,
} from "../types/models";
import { parseBudgetAmount } from "../utils/budget";
import {
  getAddPermission,
  parseExpenseDate,
  sortExpenses,
  type ExpenseRecord,
} from "../utils/expenses";
import type { MemberRecord } from "../utils/members";
import {
  validateExpenseAmount,
  validateExpenseNote,
} from "../utils/validation";

// ====================================================================================
// Types
// ====================================================================================

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

export type ExpensesEvent =
  | { status: "ready"; expenses: ExpenseRecord[] }
  | { status: "error"; error: unknown };

export type ExpenseErrorCode =
  | "not-allowed"
  | "invalid-category"
  | "invalid-amount"
  | "invalid-date"
  | "invalid-payer"
  | "invalid-split"
  | "invalid-note"
  | "rejected"
  | "unknown";

export class ExpenseError extends Error {
  readonly code: ExpenseErrorCode;

  constructor(code: ExpenseErrorCode, message: string) {
    super(message);
    Object.setPrototypeOf(this, ExpenseError.prototype);
    this.name = "ExpenseError";
    this.code = code;
  }
}

export type AddExpenseInput = {
  familyId: string;
  uid: string;
  member: MemberRecord | null;
  isAdmin: boolean;
  budget: Pick<Budget, "membersCanAddExpenses"> | null;
  activeMembers: MemberRecord[];
  categoryId: ExpenseCategoryId;
  amountText: string;
  dateText: string;
  paidBy: string | null;
  splitAmong: string[];
  note: string;
  receiptUri?: string | null;
};


// ====================================================================================
// Subscriptions & Queries
// ====================================================================================

const expenseQuery = (familyId: string, monthKey: string) =>
  query(
    collection(db, "expenses"),
    where("familyId", "==", familyId),
    where("monthKey", "==", monthKey),
  );

export function subscribeToExpenses(
  familyId: string,
  monthKey: string,
  onEvent: (e: ExpensesEvent) => void,
): () => void {
  return onSnapshot(
    expenseQuery(familyId, monthKey),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.empty && snap.metadata.fromCache) return;
      const expenses = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data({ serverTimestamps: "estimate" }) as Expense),
      }));
      onEvent({ status: "ready", expenses: sortExpenses(expenses) });
    },
    (error) => onEvent({ status: "error", error }),
  );
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
      const expenses = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data({ serverTimestamps: "estimate" }) as Expense),
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

export async function getMonthSpent(
  familyId: string,
  monthKey: string,
): Promise<number | null> {
  try {
    const snap = await getDocs(expenseQuery(familyId, monthKey));
    return snap.docs.reduce((sum, d) => {
      const data = d.data() as Expense;
      return data.status === "Shared" ? sum + data.amount : sum;
    }, 0);
  } catch {
    return null;
  }
}

// ====================================================================================
// Mutations: Add, Approve, Delete
// ====================================================================================

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", expenseId));
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<string> {
  const day = input.date;
  const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;
  const expenseData = {
    familyId: input.familyId,
    monthKey,
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

export async function addExpense(
  input: AddExpenseInput,
): Promise<{ id: string; status: ExpenseStatus }> {
  const permission = getAddPermission({
    isAdmin: input.isAdmin,
    member: input.member,
    budget: input.budget,
  });
  if (!permission.allowed || !input.member) {
    throw new ExpenseError(
      "not-allowed",
      permission.allowed ? "Couldn't add the expense." : permission.reason,
    );
  }
  const status: ExpenseStatus = permission.pending ? "Pending" : "Shared";

  if (!isExpenseCategoryId(input.categoryId)) {
    throw new ExpenseError("invalid-category", "Please choose a category.");
  }

  const amountError = validateExpenseAmount(input.amountText);
  const amount = parseBudgetAmount(input.amountText);
  if (amountError || amount === null) {
    throw new ExpenseError(
      "invalid-amount",
      amountError ?? "Please enter the amount.",
    );
  }

  const parsedDate = parseExpenseDate(input.dateText);
  if (!parsedDate.ok) throw new ExpenseError("invalid-date", parsedDate.error);

  const activeIds = input.activeMembers.map((m) => m.id);
  const paidBy = input.paidBy ?? input.member.id;
  if (!activeIds.includes(paidBy)) {
    throw new ExpenseError(
      "invalid-payer",
      "The person who paid must be a member of your family.",
    );
  }

  const requestedSplit = [...new Set(input.splitAmong)];
  if (requestedSplit.some((id) => !activeIds.includes(id))) {
    throw new ExpenseError(
      "invalid-split",
      "You can only split between members of your family.",
    );
  }
  const splitAmong = requestedSplit.length > 0 ? requestedSplit : activeIds;

  const note = input.note.trim();
  const noteError = validateExpenseNote(note);
  if (noteError) throw new ExpenseError("invalid-note", noteError);

  const day = parsedDate.date;
  const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;
  const ref = doc(collection(db, "expenses"));
  const data = {
    familyId: input.familyId,
    monthKey,
    categoryId: input.categoryId,
    title: getExpenseCategory(input.categoryId).label,
    amount,
    paidBy,
    splitAmong,
    status,
    note,
    date: Timestamp.fromDate(
      new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate())),
    ),
    createdBy: input.uid,
    createdByMember: input.member.id,
    createdAt: serverTimestamp(),
    receiptUri: input.receiptUri || null,
  };


  try {
    await setDoc(ref, data);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new ExpenseError(
        "rejected",
        "Couldn't add the expense. You may not have permission to add expenses right now.",
      );
    }
    throw new ExpenseError(
      "unknown",
      "Couldn't add the expense. Check your connection and try again.",
    );
  }

  return { id: ref.id, status };
}

export async function approveExpense(input: {
  expenseId: string;
  isAdmin: boolean;
}): Promise<void> {
  if (!input.isAdmin) {
    throw new ExpenseError(
      "not-allowed",
      "Only the family admin can approve expenses.",
    );
  }
  try {
    await updateDoc(doc(db, "expenses", input.expenseId), { status: "Shared" });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new ExpenseError(
        "rejected",
        "Couldn't approve the expense. It may already have been approved.",
      );
    }
    throw new ExpenseError(
      "unknown",
      "Couldn't approve the expense. Check your connection and try again.",
    );
  }
}

export function getExpenseErrorMessage(error: unknown): string {
  if (error instanceof ExpenseError) return error.message;
  return "Something went wrong. Please try again.";
}
