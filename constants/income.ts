export const INCOME_SOURCES = ["Salary", "Business", "Rental", "Interest", "Other"] as const;
export type IncomeSource = (typeof INCOME_SOURCES)[number];
export type IncomeEntry = {
  id: string; title: string; amount: number; source: IncomeSource; date: string;
  familyId: string; createdBy: string; memberId: string;
  status: "Received" | "Expected"; familyBudget: boolean; version: number; createdAtMs: number;
};
export type IncomeInput = { title: string; amountText: string; source: IncomeSource; date: string; status: "Received" | "Expected"; familyBudget: boolean };
export const SOURCE_STYLE: Record<IncomeSource, { symbol: string; color: string; background: string }> = {
  Salary: { symbol: "▣", color: "#00c878", background: "#e8f8f0" },
  Business: { symbol: "⚒", color: "#4b8df8", background: "#eef2ff" },
  Rental: { symbol: "⌂", color: "#ed77a4", background: "#fff0e6" },
  Interest: { symbol: "↗", color: "#a18bd8", background: "#fff0e6" },
  Other: { symbol: "+", color: "#9aa3af", background: "#f1f3f5" },
};
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const money = (amount: number) => amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
