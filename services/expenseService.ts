import {
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

import { isExpenseCategoryId, getExpenseCategory } from "../constants/categories";
import { db } from "../lib/firebase";
import type { Budget, Expense, ExpenseCategoryId, ExpenseStatus } from "../types/models";
import { getMonthKey, parseBudgetAmount } from "../utils/budget";
import { getExpenseActions } from "../utils/expenseActions";
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

// ------------------------------------------------------------------------------------
// Editing and deleting (current month only; the rules enforce the same)
// ------------------------------------------------------------------------------------

type ChangeExpenseContext = {
  /** The expense as it is now. */
  expense: ExpenseRecord;
  /** uid of the signed-in user. */
  uid: string;
  isAdmin: boolean;
  /** The signed-in user's own member document. */
  member: MemberRecord | null;
};

function getPermissionCode(error: unknown): string {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
}

function actionsFor({ expense, uid, isAdmin, member }: ChangeExpenseContext) {
  return getExpenseActions({
    isAdmin,
    isOwnExpense: expense.createdBy === uid,
    status: expense.status,
    isCurrentMonth: expense.monthKey === getMonthKey(),
    canAddExpenses: member?.canAddExpenses === true,
  });
}

export type UpdateExpenseInput = ChangeExpenseContext & {
  /** Everyone who has joined the family; the allowed payers. */
  activeMembers: MemberRecord[];
  categoryId: ExpenseCategoryId;
  /** Raw text from the amount field, e.g. "20,000". */
  amountText: string;
  /** Raw DD/MM/YY or DD/MM/YYYY text. */
  dateText: string;
  /** memberId who paid. */
  paidBy: string;
  note: string;
  /** The memberIds to split between (1 or more). Leave undefined to keep the expense's current split. */
  splitAmong?: string[];
};

/**
 * Edits an expense's category, amount, payer, date, note and (optionally) split. Its status and ownership
 * fields never change here (approval is its own action). The admin may edit any expense of the current
 * month; a member only their own Pending one. Throws ExpenseError with a message that is safe to show.
 */
export async function updateExpense(input: UpdateExpenseInput): Promise<void> {
  if (!actionsFor(input).includes("edit")) {
    throw new ExpenseError("not-allowed", "You can't edit this expense.");
  }

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

  if (!input.activeMembers.some((member) => member.id === input.paidBy)) {
    throw new ExpenseError("invalid-payer", "The person who paid must be a member of your family.");
  }

  const note = input.note.trim();
  const noteError = validateExpenseNote(note);
  if (noteError) throw new ExpenseError("invalid-note", noteError);

  // Only a split that was provided is changed; it must be members of this family.
  let splitAmong: string[] | undefined;
  if (input.splitAmong !== undefined) {
    splitAmong = [...new Set(input.splitAmong)];
    if (splitAmong.length === 0 || splitAmong.some((id) => !input.activeMembers.some((member) => member.id === id))) {
      throw new ExpenseError("invalid-split", "You can only split between members of your family.");
    }
  }

  const day = parsedDate.date;
  const monthKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}`;

  try {
    await updateDoc(doc(db, "expenses", input.expense.id), {
      categoryId: input.categoryId,
      title: getExpenseCategory(input.categoryId).label,
      amount,
      paidBy: input.paidBy,
      note,
      ...(splitAmong ? { splitAmong } : {}),
      date: Timestamp.fromDate(new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()))),
      monthKey,
    });
  } catch (error) {
    if (getPermissionCode(error) === "permission-denied") {
      throw new ExpenseError(
        "rejected",
        "Couldn't save the changes. This expense may have been approved or changed since you opened it.",
      );
    }
    throw new ExpenseError("unknown", "Couldn't save the changes. Check your connection and try again.");
  }
}

/**
 * Deletes an expense: the admin any expense of the current month (a Pending one is a decline), a member
 * only their own Pending expense (a withdrawal). Throws ExpenseError with a message safe to show.
 */
export async function deleteExpense(input: ChangeExpenseContext): Promise<void> {
  if (!actionsFor(input).includes("delete")) {
    throw new ExpenseError("not-allowed", "You can't delete this expense.");
  }
  try {
    await deleteDoc(doc(db, "expenses", input.expense.id));
  } catch (error) {
    if (getPermissionCode(error) === "permission-denied") {
      throw new ExpenseError(
        "rejected",
        "Couldn't delete the expense. It may have been approved or changed since you opened it.",
      );
    }
    throw new ExpenseError("unknown", "Couldn't delete the expense. Check your connection and try again.");
  }
}

export function getExpenseErrorMessage(error: unknown): string {
  if (error instanceof ExpenseError) return error.message;
  return "Something went wrong. Please try again.";
}
