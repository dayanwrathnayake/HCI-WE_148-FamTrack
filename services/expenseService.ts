import {
  collection,
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

import { isExpenseCategoryId, getExpenseCategory } from "../constants/categories";
import { db } from "../lib/firebase";
import type { Budget, Expense, ExpenseCategoryId, ExpenseStatus } from "../types/models";
import { parseBudgetAmount } from "../utils/budget";
import {
  getAddPermission,
  parseExpenseDate,
  sortExpenses,
  type ExpenseRecord,
} from "../utils/expenses";
import type { MemberRecord } from "../utils/members";
import { validateExpenseAmount, validateExpenseNote } from "../utils/validation";

// ONE backend for expenses. + Add Expense, Add Shared Expense, Shared Expenses > Expenses,
// Expense History, the Family Budget and Category Budget spent amounts and the member contribution
// totals must all go through this service and the ExpenseContext built on it. Do not add a second
// expense model, collection or context.
//
//   expenses/{expenseId}       (family + monthKey + status; see types/models.ts)
//
// Nothing derived is stored (spent, per-category, per-member, percentages, equal shares).
// A PENDING expense (a member's, waiting for the admin) never counts as spending.

export type ExpensesEvent =
  | { status: "ready"; expenses: ExpenseRecord[] }
  | { status: "error"; error: unknown };

const expenseQuery = (familyId: string, monthKey: string) =>
  query(collection(db, "expenses"), where("familyId", "==", familyId), where("monthKey", "==", monthKey));

/** Live listener on one family's expenses for one month. Returns the unsubscribe function. */
export function subscribeToExpenses(
  familyId: string,
  monthKey: string,
  onEvent: (e: ExpensesEvent) => void,
): () => void {
  return onSnapshot(
    expenseQuery(familyId, monthKey),
    { includeMetadataChanges: true },
    (snap) => {
      // An EMPTY answer served from the local cache means "not loaded yet", not "no expenses".
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

/** One-off read of a month's SHARED spending (used for the "vs last month" comparison). */
export async function getMonthSpent(familyId: string, monthKey: string): Promise<number | null> {
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

// ------------------------------------------------------------------------------------
// Adding
// ------------------------------------------------------------------------------------

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
  /** uid of the signed-in user. */
  uid: string;
  /** The signed-in user's own member document. */
  member: MemberRecord | null;
  isAdmin: boolean;
  /** This month's budget, or null when none is set (that never blocks an expense). */
  budget: Pick<Budget, "membersCanAddExpenses"> | null;
  /** Everyone who has joined the family; the default split and the allowed payers. */
  activeMembers: MemberRecord[];
  categoryId: ExpenseCategoryId;
  /** Raw text from the amount field, e.g. "20,000". */
  amountText: string;
  /** Raw DD/MM/YY text. */
  dateText: string;
  /** memberId who paid; null means the signed-in user. */
  paidBy: string | null;
  /** memberIds to split between; empty means every active member. */
  splitAmong: string[];
  /** Free text. May be empty. */
  note: string;
};

/**
 * Adds an expense. The admin's expense is Shared immediately; a permitted member's is Pending until
 * the admin approves it. Throws ExpenseError with a message that is safe to show.
 */
export async function addExpense(input: AddExpenseInput): Promise<{ id: string; status: ExpenseStatus }> {
  const permission = getAddPermission({ isAdmin: input.isAdmin, member: input.member, budget: input.budget });
  if (!permission.allowed || !input.member) {
    throw new ExpenseError("not-allowed", permission.allowed ? "Couldn't add the expense." : permission.reason);
  }
  const status: ExpenseStatus = permission.pending ? "Pending" : "Shared";

  if (!isExpenseCategoryId(input.categoryId)) {
    throw new ExpenseError("invalid-category", "Please choose a category.");
  }

  const amountError = validateExpenseAmount(input.amountText);
  const amount = parseBudgetAmount(input.amountText);
  if (amountError || amount === null) {
    throw new ExpenseError("invalid-amount", amountError ?? "Please enter the amount.");
  }

  const parsedDate = parseExpenseDate(input.dateText);
  if (!parsedDate.ok) throw new ExpenseError("invalid-date", parsedDate.error);

  const activeIds = input.activeMembers.map((m) => m.id);
  const paidBy = input.paidBy ?? input.member.id;
  if (!activeIds.includes(paidBy)) {
    throw new ExpenseError("invalid-payer", "The person who paid must be a member of your family.");
  }

  const requestedSplit = [...new Set(input.splitAmong)];
  if (requestedSplit.some((id) => !activeIds.includes(id))) {
    throw new ExpenseError("invalid-split", "You can only split between members of your family.");
  }
  // Nobody picked: everyone shares equally.
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
    date: Timestamp.fromDate(new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()))),
    createdBy: input.uid,
    createdByMember: input.member.id,
    createdAt: serverTimestamp(),
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
    throw new ExpenseError("unknown", "Couldn't add the expense. Check your connection and try again.");
  }

  return { id: ref.id, status };
}

/** The admin approves a Pending expense, which makes it Shared and counts it as spending. */
export async function approveExpense(input: { expenseId: string; isAdmin: boolean }): Promise<void> {
  if (!input.isAdmin) {
    throw new ExpenseError("not-allowed", "Only the family admin can approve expenses.");
  }
  try {
    await updateDoc(doc(db, "expenses", input.expenseId), { status: "Shared" });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new ExpenseError("rejected", "Couldn't approve the expense. It may already have been approved.");
    }
    throw new ExpenseError("unknown", "Couldn't approve the expense. Check your connection and try again.");
  }
}

export function getExpenseErrorMessage(error: unknown): string {
  if (error instanceof ExpenseError) return error.message;
  return "Something went wrong. Please try again.";
}
