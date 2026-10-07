import type { ExpenseCategoryId } from "../types/models";

// Pure helpers for the Home budget card, so the numbers and states are testable on their own.
// Spending here is always SHARED spending (ExpenseContext's `totals`); Pending expenses never count.

export type HomeCardState = "loading" | "error" | "no-budget" | "ready";

type BudgetLoadStatus = "idle" | "loading" | "ready" | "none" | "error";
type ExpenseLoadStatus = "idle" | "loading" | "ready" | "error";

export type HomeBudgetSummary = {
  state: HomeCardState;
  /** Shared spending this month (0 while loading or on error). */
  spent: number;
  /** This month's budget amount (0 when there is none). */
  budget: number;
  /** Never negative. */
  left: number;
  /** How far spending is past the budget (0 until it is). */
  over: number;
  /** Spending has reached or passed the budget. */
  overBudget: boolean;
  /** 0-1, for the progress bar. */
  progress: number;
};

/**
 * - error:     either listener failed
 * - loading:   either is still loading (nothing is shown half-loaded)
 * - no-budget: the server confirmed there is no budget this month; spending still shows
 * - ready:     a budget exists
 */
export function getHomeBudgetSummary(args: {
  budgetStatus: BudgetLoadStatus;
  expenseStatus: ExpenseLoadStatus;
  budgetAmount: number | null;
  spent: number;
}): HomeBudgetSummary {
  const { budgetStatus, expenseStatus, budgetAmount, spent } = args;
  const empty = { spent: 0, budget: 0, left: 0, over: 0, overBudget: false, progress: 0 };

  if (budgetStatus === "error" || expenseStatus === "error") return { state: "error", ...empty };
  if (
    budgetStatus === "idle" ||
    budgetStatus === "loading" ||
    expenseStatus === "idle" ||
    expenseStatus === "loading"
  ) {
    return { state: "loading", ...empty };
  }

  if (budgetStatus === "none" || budgetAmount === null || budgetAmount <= 0) {
    return { state: "no-budget", ...empty, spent };
  }

  return {
    state: "ready",
    spent,
    budget: budgetAmount,
    left: Math.max(0, budgetAmount - spent),
    over: Math.max(0, spent - budgetAmount),
    overBudget: spent >= budgetAmount,
    progress: Math.max(0, Math.min(1, spent / budgetAmount)),
  };
}

export type TopCategory = { id: ExpenseCategoryId; amount: number };

/** The categories with the most Shared spending, highest first. Zero amounts are ignored; ties go by id. */
export function getTopSpendingCategories(
  byCategory: Partial<Record<ExpenseCategoryId, number>>,
  limit = 3,
): TopCategory[] {
  return (Object.entries(byCategory) as [ExpenseCategoryId, number | undefined][])
    .filter((entry): entry is [ExpenseCategoryId, number] => typeof entry[1] === "number" && entry[1] > 0)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** A category's pill background: its colour at 10% opacity. Falls back to a light grey for odd values. */
export function getPillBackground(fillColor: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(fillColor) ? `${fillColor}1A` : "#f1f3f5";
}
