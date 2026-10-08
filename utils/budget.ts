import { MAX_BUDGET_AMOUNT } from "./validation";

// Helpers for family budgets. Pure functions so every screen resolves and shows budgets the same way.
//
// A budget is one document per family per month: budgets/{familyId}_{YYYY-MM}. The month key is the
// device's LOCAL calendar month; the stored startDate is the first day of that month at 00:00:00 UTC
// (the security rules can only read timestamps in UTC).

export const DEFAULT_ALERT_PERCENTAGE = 80;
export const MIN_ALERT_PERCENTAGE = 1;
export const MAX_ALERT_PERCENTAGE = 100;

/** "2026-10" for the given date's local calendar month. */
export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month }; // month is 1-12
}

/** "2026-01" -> "2025-12". */
export function getPreviousMonthKey(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** Document id of one family's budget for one month. Family ids contain no underscore. */
export const getBudgetId = (familyId: string, monthKey: string) => `${familyId}_${monthKey}`;

/** First day of the month at 00:00:00 UTC, the startDate stored on a budget. */
export function getMonthStartUtc(monthKey: string): Date {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Milliseconds until the device's next local calendar month begins. */
export function msUntilNextMonth(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.getTime() - now.getTime();
}

/** "100,000" or "100000" -> 100000. Returns null unless the text is a whole number. */
export function parseBudgetAmount(text: string): number | null {
  const digits = text.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : null;
}

/** Keeps digits only and groups them in thousands as the user types: "1000a" -> "1,000". */
export function formatAmountInput(text: string): string {
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, String(MAX_BUDGET_AMOUNT).length);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export const formatRs = (amount: number) => `Rs ${amount.toLocaleString("en-US")}`;

/** The rupee amount at which the alert fires. Derived, never stored. */
export function getAlertAmount(amount: number, alertPercentage: number): number {
  return Math.round((amount * alertPercentage) / 100);
}

/** 1-100, whole numbers. */
export const clampAlertPercentage = (value: number) =>
  Math.max(MIN_ALERT_PERCENTAGE, Math.min(MAX_ALERT_PERCENTAGE, Math.round(value)));

export type BudgetStanding = "not-set" | "on-track" | "near-limit" | "over";

/** Derived from the budget amount, what has been spent and the alert threshold. */
export function getBudgetStanding(
  budget: { amount: number; alertPercentage: number } | null,
  spent: number,
): BudgetStanding {
  if (!budget || budget.amount <= 0) return "not-set";
  if (spent >= budget.amount) return "over";
  if (spent >= getAlertAmount(budget.amount, budget.alertPercentage)) return "near-limit";
  return "on-track";
}
