import { EXPENSE_CATEGORIES, getExpenseCategory } from "../constants/categories";
import type { CategoryId, Expense, ExpenseCategoryId, WithId } from "../types/models";
import { getMonthKey } from "./budget";
import type { MemberRecord } from "./members";

// Helpers for expenses. Pure functions so every screen derives the same numbers.
//
// Only SHARED expenses count as spending. A PENDING expense (waiting for the admin) shows in lists
// with a Pending badge but is never part of any total, category amount, contribution or percentage.

export type ExpenseRecord = WithId<Expense>;

// ------------------------------------------------------------------------------------
// Dates (the user types DD/MM/YY or DD/MM/YYYY in local time; it is stored as that calendar
// day at 00:00:00 UTC, like a budget's startDate)
// ------------------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** "07/10/2026" */
export const formatExpenseDate = (date: Date): string =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

export type ParsedExpenseDate = { ok: true; date: Date } | { ok: false; error: string };

/**
 * Parses DD/MM/YY or DD/MM/YYYY. The date must be real, not in the future, and in the current
 * month. Returns the LOCAL calendar day.
 */
export function parseExpenseDate(text: string, now: Date = new Date()): ParsedExpenseDate {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return { ok: false, error: "Enter the date as DD/MM/YY." };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { ok: false, error: "That date doesn't exist." };
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date.getTime() > today.getTime()) return { ok: false, error: "The date can't be in the future." };
  if (getMonthKey(date) !== getMonthKey(now)) {
    return { ok: false, error: "Only expenses from this month can be added." };
  }
  return { ok: true, date };
}

/** The stored `date` as a Date at LOCAL midnight of the same calendar day. */
export function getExpenseDay(expense: { date: { toDate: () => Date } }): Date {
  const utc = expense.date.toDate();
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Today", "Yesterday", or "05 Oct". */
export function getDayLabel(day: Date, now: Date = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${pad(day.getDate())} ${MONTH_SHORT[day.getMonth()]}`;
}

/** "6:42 PM" from the time the expense was added. */
export function getExpenseTime(expense: { createdAt: { toDate: () => Date } | null }): string {
  if (!expense.createdAt) return "";
  return expense.createdAt.toDate().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Newest day first, then most recently added. */
export function sortExpenses(expenses: ExpenseRecord[]): ExpenseRecord[] {
  const added = (e: ExpenseRecord) => (e.createdAt ? e.createdAt.toMillis() : Number.MAX_SAFE_INTEGER);
  return [...expenses].sort((a, b) => b.date.toMillis() - a.date.toMillis() || added(b) - added(a));
}

export type ExpenseDayGroup = { label: string; expenses: ExpenseRecord[] };

/** Groups an already-sorted list by day, newest first. */
export function groupExpensesByDay(expenses: ExpenseRecord[], now: Date = new Date()): ExpenseDayGroup[] {
  const groups: ExpenseDayGroup[] = [];
  for (const expense of expenses) {
    const label = getDayLabel(getExpenseDay(expense), now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.expenses.push(expense);
    else groups.push({ label, expenses: [expense] });
  }
  return groups;
}

// ------------------------------------------------------------------------------------
// Totals (SHARED expenses only)
// ------------------------------------------------------------------------------------

export type ExpenseTotals = {
  /** Everything the family has spent this month (shared expenses only). */
  spent: number;
  sharedCount: number;
  pendingCount: number;
  byCategory: Partial<Record<ExpenseCategoryId, number>>;
  /** Keyed by the memberId who PAID. */
  byMember: Record<string, { amount: number; count: number }>;
};

export function computeTotals(expenses: ExpenseRecord[]): ExpenseTotals {
  const totals: ExpenseTotals = { spent: 0, sharedCount: 0, pendingCount: 0, byCategory: {}, byMember: {} };
  for (const expense of expenses) {
    if (expense.status !== "Shared") {
      totals.pendingCount += 1;
      continue;
    }
    totals.spent += expense.amount;
    totals.sharedCount += 1;
    totals.byCategory[expense.categoryId] = (totals.byCategory[expense.categoryId] ?? 0) + expense.amount;
    const member = totals.byMember[expense.paidBy] ?? { amount: 0, count: 0 };
    totals.byMember[expense.paidBy] = { amount: member.amount + expense.amount, count: member.count + 1 };
  }
  return totals;
}

/**
 * What a Category Budget row has spent. An allocated category counts its own expenses. "Other" counts
 * its own expenses PLUS the expenses of any category that has no budget share, so every rupee spent
 * lands in exactly one row and the rows add up to the overall total.
 */
export function getCategorySpent(
  byCategory: ExpenseTotals["byCategory"],
  rowId: CategoryId | "other",
  allocatedIds: CategoryId[],
): number {
  if (rowId !== "other") return byCategory[rowId] ?? 0;
  const unallocated = EXPENSE_CATEGORIES.filter(
    (category) => category.id !== "other" && !allocatedIds.includes(category.id as CategoryId),
  ).reduce((sum, category) => sum + (byCategory[category.id] ?? 0), 0);
  return (byCategory.other ?? 0) + unallocated;
}

/** A member's share of the total, as a whole percentage (0 when nothing has been spent). */
export const getContributionPercent = (amount: number, total: number): number =>
  total > 0 ? Math.round((amount / total) * 100) : 0;

/** What each person owes in an equal split. Derived for display, never stored. */
export const getEqualShare = (amount: number, people: number): number => (people > 0 ? amount / people : 0);

// ------------------------------------------------------------------------------------
// Who may add expenses
// ------------------------------------------------------------------------------------

export type AddPermission =
  | { allowed: true; /** The expense will wait for the admin's approval. */ pending: boolean }
  | { allowed: false; reason: string };

/**
 * - Admin: allowed, shared immediately.
 * - Member whose own "can add expenses" is off: blocked.
 * - Member while this month's budget says members can't add expenses: blocked.
 * - Any other member: allowed, but the expense is Pending until the admin approves it.
 * No budget for the month does not block anyone.
 */
export function getAddPermission(args: {
  isAdmin: boolean;
  member: MemberRecord | null;
  budget: { membersCanAddExpenses: boolean } | null;
}): AddPermission {
  const { isAdmin, member, budget } = args;
  if (!member || member.status !== "active") {
    return { allowed: false, reason: "Your family hasn't loaded yet. Please try again." };
  }
  if (isAdmin) return { allowed: true, pending: false };
  if (!member.canAddExpenses) {
    return { allowed: false, reason: "You don't have permission to add expenses. Ask the family admin." };
  }
  if (budget && budget.membersCanAddExpenses === false) {
    return { allowed: false, reason: "Members can't add expenses this month. Ask the family admin." };
  }
  return { allowed: true, pending: true };
}

// ------------------------------------------------------------------------------------
// Display
// ------------------------------------------------------------------------------------

export const getExpenseCategoryLabel = (id: ExpenseCategoryId): string => getExpenseCategory(id).label;

/** "split 3 ways" / "" for a single person. */
export const getSplitText = (splitAmong: string[]): string =>
  splitAmong.length > 1 ? `split ${splitAmong.length} ways` : "";
