import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addExpense as addExpenseDocument,
  approveExpense as approveExpenseDocument,
  getMonthSpent,
  subscribeToExpenses,
} from "../services/expenseService";
import type { ExpenseCategoryId, ExpenseStatus } from "../types/models";
import { getPreviousMonthKey } from "../utils/budget";
import {
  computeTotals,
  getAddPermission,
  type AddPermission,
  type ExpenseRecord,
  type ExpenseTotals,
} from "../utils/expenses";
import { useAuth } from "./AuthContext";
import { useBudget } from "./BudgetContext";
import { useFamily } from "./FamilyContext";

// The ONE source of truth for the family's expenses in the CURRENT month:
//   Firestore expenses (familyId + monthKey)  ->  expenseService  ->  this context
// + Add Expense, Add Shared Expense, Shared Expenses, Expense History, the Family Budget and Category
// Budget spent amounts and the member contributions all read from here.
//
// Only SHARED expenses count as spending. Pending expenses (a member's, waiting for the admin) are in
// `expenses` so lists can show them with a Pending badge, but they are never part of `totals`.

/**
 * idle     - not signed in or no family yet
 * loading  - waiting for this month's expenses
 * ready    - loaded (the month may have none)
 * error    - the listener failed
 */
export type ExpenseStatusState = "idle" | "loading" | "ready" | "error";

export type AddExpenseValues = {
  categoryId: ExpenseCategoryId;
  /** Raw text from the amount field, e.g. "20,000". */
  amountText: string;
  /** Raw DD/MM/YY text. */
  dateText: string;
  /** memberId who paid; null means the signed-in user. */
  paidBy: string | null;
  /** memberIds to split between; empty means every active member. */
  splitAmong: string[];
  note: string;
};

type ExpenseContextValue = {
  status: ExpenseStatusState;
  /** This month's expenses, shared and pending, newest first. */
  expenses: ExpenseRecord[];
  /** Totals over SHARED expenses only. */
  totals: ExpenseTotals;
  /** Whether the signed-in user may add an expense now, and whether it will need approval. */
  permission: AddPermission;
  addExpense: (values: AddExpenseValues) => Promise<{ id: string; status: ExpenseStatus }>;
  /** Admin only: Pending -> Shared. */
  approveExpense: (expenseId: string) => Promise<void>;
  /** Last month's SHARED spending, or null if it couldn't be read. */
  loadPreviousMonthSpent: () => Promise<number | null>;
};

type Loaded = {
  key: string | null;
  expenses: ExpenseRecord[];
  state: "loading" | "ready" | "error";
};

const EMPTY: Loaded = { key: null, expenses: [], state: "loading" };
const NO_EXPENSES: ExpenseRecord[] = [];

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const { family, activeMembers, currentMember, isAdmin } = useFamily();
  const { budget, monthKey } = useBudget();

  const uid = isSignedIn && user ? user.uid : null;
  const familyId = uid ? (family?.id ?? null) : null;
  // Everything loaded below belongs to exactly one (user, family, month).
  const key = uid && familyId ? `${uid}:${familyId}:${monthKey}` : null;

  const [loaded, setLoaded] = useState<Loaded>(EMPTY);

  useEffect(() => {
    if (!key || !familyId) {
      setLoaded(EMPTY);
      return;
    }

    setLoaded({ ...EMPTY, key });
    const unsubscribe = subscribeToExpenses(familyId, monthKey, (event) => {
      setLoaded((prev) => {
        if (prev.key !== key) return prev; // a newer user/family/month is already active
        if (event.status === "ready") return { key, expenses: event.expenses, state: "ready" };
        console.warn("[expenses] expense listener failed", event.error);
        return { key, expenses: [], state: "error" };
      });
    });

    return unsubscribe;
  }, [key, familyId, monthKey]);

  // Only data that belongs to the CURRENT user+family+month is exposed, so a previous account's
  // expenses can never appear, not even for one render while switching.
  const current = loaded.key === key ? loaded : EMPTY;
  const status: ExpenseStatusState = !key ? "idle" : current.state;
  const expenses = key ? current.expenses : NO_EXPENSES;

  const totals = useMemo(() => computeTotals(expenses), [expenses]);
  const permission = useMemo(
    () => getAddPermission({ isAdmin, member: currentMember, budget }),
    [isAdmin, currentMember, budget],
  );

  const addExpense = useCallback(
    (values: AddExpenseValues) => {
      if (!uid || !familyId) {
        return Promise.reject(new Error("Your family hasn't loaded yet. Please try again."));
      }
      return addExpenseDocument({
        familyId,
        uid,
        member: currentMember,
        isAdmin,
        budget,
        activeMembers,
        ...values,
      });
    },
    [uid, familyId, currentMember, isAdmin, budget, activeMembers],
  );

  const approveExpense = useCallback(
    (expenseId: string) => approveExpenseDocument({ expenseId, isAdmin }),
    [isAdmin],
  );

  const loadPreviousMonthSpent = useCallback(
    async () => (familyId ? getMonthSpent(familyId, getPreviousMonthKey(monthKey)) : null),
    [familyId, monthKey],
  );

  const value = useMemo<ExpenseContextValue>(
    () => ({ status, expenses, totals, permission, addExpense, approveExpense, loadPreviousMonthSpent }),
    [status, expenses, totals, permission, addExpense, approveExpense, loadPreviousMonthSpent],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const value = useContext(ExpenseContext);
  if (!value) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return value;
}
