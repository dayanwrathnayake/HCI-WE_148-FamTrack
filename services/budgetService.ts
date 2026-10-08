import { deleteDoc, doc, getDoc, onSnapshot, setDoc, Timestamp, updateDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import type { Budget, CategoryShares, WithId } from "../types/models";
import {
  clampAlertPercentage,
  getBudgetId,
  getMonthStartUtc,
  getPreviousMonthKey,
  parseBudgetAmount,
} from "../utils/budget";
import { normalizeShares, validateCategoryShares } from "../utils/categories";
import { validateBudgetAmount, validateBudgetName } from "../utils/validation";

// ONE backend for family budgets. Every screen that shows or edits the family's budget
// (Family Budget, Edit Family Budget and later Category Budgets, expenses, Home) must go through
// this service and the BudgetContext built on it.
//
//   budgets/{familyId}_{YYYY-MM}     one document per family per month
//   (create/read/update/delete: only the current month's budget can be changed or deleted)
//
// The id is deterministic, so a family can never have two budgets for the same month, and a new
// month never overwrites an earlier one. Nothing derived (spent, left, percentages) is stored.

export type BudgetEvent =
  | { status: "ready"; budget: WithId<Budget> }
  | { status: "none" }
  | { status: "error"; error: unknown };

/** Live listener on one budget document. Returns the unsubscribe function. */
export function subscribeToBudget(budgetId: string, onEvent: (e: BudgetEvent) => void): () => void {
  return onSnapshot(
    doc(db, "budgets", budgetId),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) {
        const data = snap.data({ serverTimestamps: "estimate" }) as Budget;
        // A budget saved before categories existed has no map: it is read as the default split.
        onEvent({ status: "ready", budget: { id: snap.id, ...data, categories: normalizeShares(data.categories) } });
      } else if (!snap.metadata.fromCache) {
        // Only the server can confirm that this month has no budget yet.
        onEvent({ status: "none" });
      }
    },
    (error) => onEvent({ status: "error", error }),
  );
}

/** The only fields copied from an earlier month. Everything else is created fresh on save. */
export type BudgetPrefill = Pick<
  Budget,
  "name" | "amount" | "alertPercentage" | "membersCanAddExpenses" | "categories"
>;

/**
 * One-off read of the PREVIOUS month's budget, used only to pre-fill the form when the current month
 * has none. It never writes. Returns null if there is no such budget or it can't be read.
 */
export async function getPreviousMonthPrefill(
  familyId: string,
  monthKey: string,
): Promise<BudgetPrefill | null> {
  try {
    const snap = await getDoc(doc(db, "budgets", getBudgetId(familyId, getPreviousMonthKey(monthKey))));
    if (!snap.exists()) return null;
    const data = snap.data() as Budget;
    return {
      name: data.name,
      amount: data.amount,
      alertPercentage: data.alertPercentage,
      membersCanAddExpenses: data.membersCanAddExpenses,
      categories: normalizeShares(data.categories),
    };
  } catch {
    return null; // prefill is only a convenience
  }
}

// ------------------------------------------------------------------------------------
// Saving
// ------------------------------------------------------------------------------------

export type BudgetErrorCode =
  | "not-admin"
  | "no-family"
  | "invalid-name"
  | "invalid-amount"
  | "invalid-alert"
  | "invalid-categories"
  | "rejected"
  | "unknown";

export class BudgetError extends Error {
  readonly code: BudgetErrorCode;

  constructor(code: BudgetErrorCode, message: string) {
    super(message);
    Object.setPrototypeOf(this, BudgetError.prototype);
    this.name = "BudgetError";
    this.code = code;
  }
}

export type SaveBudgetInput = {
  familyId: string;
  /** uid of the signed-in user (stored as createdBy when the month's budget is first created). */
  uid: string;
  /** Whether the caller is the family admin (the rules enforce this regardless). */
  isAdmin: boolean;
  /** The month being saved, "YYYY-MM" (the device's current local month). */
  monthKey: string;
  /** True when this month's budget document already exists. */
  exists: boolean;
  name: string;
  /** Raw text from the amount field, e.g. "100,000". */
  amountText: string;
  alertPercentage: number;
  membersCanAddExpenses: boolean;
  /** Explicit category shares only. "Other" is never stored; it is whatever is left of 100%. */
  categories: CategoryShares;
};

/**
 * Creates this month's budget, or updates its editable fields. An update never touches familyId,
 * createdBy, period or startDate, and no other month's document is ever written.
 */
export async function saveBudget(input: SaveBudgetInput): Promise<void> {
  if (!input.isAdmin) {
    throw new BudgetError("not-admin", "Only the family admin can change the budget.");
  }
  if (!input.familyId) {
    throw new BudgetError("no-family", "Your family hasn't loaded yet. Please try again.");
  }

  const nameError = validateBudgetName(input.name);
  if (nameError) throw new BudgetError("invalid-name", nameError);

  const amountError = validateBudgetAmount(input.amountText);
  const amount = parseBudgetAmount(input.amountText);
  if (amountError || amount === null) {
    throw new BudgetError("invalid-amount", amountError ?? "Please enter the monthly budget.");
  }

  if (!Number.isFinite(input.alertPercentage)) {
    throw new BudgetError("invalid-alert", "Please choose when to be alerted.");
  }
  const alertPercentage = clampAlertPercentage(input.alertPercentage);

  const categoriesError = validateCategoryShares(input.categories);
  if (categoriesError) throw new BudgetError("invalid-categories", categoriesError);

  const ref = doc(db, "budgets", getBudgetId(input.familyId, input.monthKey));
  const editable = {
    name: input.name.trim(),
    amount,
    alertPercentage,
    membersCanAddExpenses: input.membersCanAddExpenses,
    // The whole map is replaced, so a removed category disappears (its share becomes Other).
    categories: { ...input.categories },
  };

  try {
    if (input.exists) {
      await updateDoc(ref, editable);
    } else {
      const data: Budget = {
        familyId: input.familyId,
        ...editable,
        period: "monthly",
        startDate: Timestamp.fromDate(getMonthStartUtc(input.monthKey)),
        createdBy: input.uid,
      };
      await setDoc(ref, data);
    }
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new BudgetError("rejected", "Couldn't save the budget. Only the family admin can change it.");
    }
    throw new BudgetError("unknown", "Couldn't save the budget. Check your connection and try again.");
  }
}

/**
 * Deletes THIS month's budget (admin only; the rules also refuse any other month, so earlier
 * budgets stay as history). Expenses do not point at a budget, so they are untouched: the month
 * simply has no budget until the admin sets one again.
 */
export async function deleteBudget(input: {
  familyId: string;
  isAdmin: boolean;
  /** The device's current local month, "YYYY-MM". */
  monthKey: string;
}): Promise<void> {
  if (!input.isAdmin) {
    throw new BudgetError("not-admin", "Only the family admin can delete the budget.");
  }
  if (!input.familyId) {
    throw new BudgetError("no-family", "Your family hasn't loaded yet. Please try again.");
  }

  try {
    await deleteDoc(doc(db, "budgets", getBudgetId(input.familyId, input.monthKey)));
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    if (code === "permission-denied") {
      throw new BudgetError("rejected", "Couldn't delete the budget. Only the family admin can delete this month's budget.");
    }
    throw new BudgetError("unknown", "Couldn't delete the budget. Check your connection and try again.");
  }
}

export function getBudgetErrorMessage(error: unknown): string {
  if (error instanceof BudgetError) return error.message;
  return "Something went wrong. Please try again.";
}
