import type { CategoryId, CategoryShares, ExpenseCategoryId } from "../types/models";

// The canonical budget categories. Family budgets store a percentage share per CategoryId;
// "other" is NOT a CategoryId: it is always derived as whatever is left of the 100%.
// (The expense phase should later migrate Add Expense, Expense History and Bills to these ids.)

export type CategoryDefinition = {
  id: CategoryId;
  label: string;
  emoji: string;
  iconBackground: string;
  fillColor: string;
};

/** In display order: the Figma five first, then the optional ones that can be added. */
export const BUDGET_CATEGORIES: CategoryDefinition[] = [
  { id: "food", label: "Food", emoji: "🍔", iconBackground: "#e8f8f0", fillColor: "#00c46a" },
  { id: "shopping", label: "Shopping", emoji: "🛍", iconBackground: "#eef2ff", fillColor: "#4b8df8" },
  { id: "health", label: "Health", emoji: "🩺", iconBackground: "#ffe9f0", fillColor: "#f2789b" },
  { id: "transport", label: "Transport", emoji: "🚗", iconBackground: "#eaf7ff", fillColor: "#ff7a45" },
  { id: "bills", label: "Bills", emoji: "🧾", iconBackground: "#f1eeff", fillColor: "#7c5cf2" },
  { id: "groceries", label: "Groceries", emoji: "🛒", iconBackground: "#fff7e0", fillColor: "#f5b301" },
  { id: "entertainment", label: "Entertainment", emoji: "🎬", iconBackground: "#fdeaff", fillColor: "#c05bd6" },
];

export const OTHER_CATEGORY = {
  id: "other" as const,
  label: "Other",
  emoji: "•••",
  iconBackground: "#edf0f3",
  fillColor: "#9aa3ae",
};

export const CATEGORY_IDS: CategoryId[] = BUDGET_CATEGORIES.map((category) => category.id);

export const getCategoryDefinition = (id: CategoryId): CategoryDefinition =>
  BUDGET_CATEGORIES.find((category) => category.id === id) as CategoryDefinition;

/** What a family's first budget starts with: Food 20, Shopping 30, Health 15, Transport 15, Bills 12 (Other 8). */
export const DEFAULT_CATEGORY_SHARES: CategoryShares = {
  food: 20,
  shopping: 30,
  health: 15,
  transport: 15,
  bills: 12,
};

export type ExpenseCategoryDefinition = {
  id: ExpenseCategoryId;
  label: string;
  emoji: string;
  iconBackground: string;
  fillColor: string;
};

/** Every category an expense can have, in the order the pickers show them ("other" last). */
const EXPENSE_CATEGORY_ORDER: ExpenseCategoryId[] = [
  "food",
  "groceries",
  "shopping",
  "transport",
  "bills",
  "health",
  "entertainment",
  "other",
];

export const EXPENSE_CATEGORIES: ExpenseCategoryDefinition[] = EXPENSE_CATEGORY_ORDER.map((id) =>
  id === "other" ? OTHER_CATEGORY : getCategoryDefinition(id),
);

export const isExpenseCategoryId = (value: unknown): value is ExpenseCategoryId =>
  typeof value === "string" && EXPENSE_CATEGORY_ORDER.includes(value as ExpenseCategoryId);

export const getExpenseCategory = (id: ExpenseCategoryId): ExpenseCategoryDefinition =>
  EXPENSE_CATEGORIES.find((category) => category.id === id) ?? OTHER_CATEGORY;
