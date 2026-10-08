import type { ExpenseStatus } from "../types/models";

// View model for one row of Expense History. Built from the real expenses (see utils/expenses.ts);
// there is no mock data any more. Categories come from constants/categories.ts.
export type { ExpenseStatus };

export type HistoryItem = {
  id: string;
  title: string;
  /** The category's label, e.g. "Groceries". */
  category: string;
  time: string;
  date?: string;
  payerText: string;
  amount: number;
  status: ExpenseStatus;
  iconBg: string;
  iconEmoji: string;
  receiptUri?: string | null;
  note?: string | null;
};
