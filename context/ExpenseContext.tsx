import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useBudget } from "./BudgetContext";
import { useFamily } from "./FamilyContext";
import { getExpenseCategory } from "../constants/categories";
import type { HistoryItem } from "../constants/history";
import {
  addExpense as addExpenseDocument,
  approveExpense as approveExpenseDocument,
  deleteExpense as deleteExpenseDocument,
  getMonthSpent,
  subscribeToExpenses,
  updateExpense as updateExpenseDocument,
} from "../services/expenseService";
import type { ExpenseCategoryId, ExpenseStatus } from "../types/models";
import { getMonthKey, getPreviousMonthKey } from "../utils/budget";
import { getExpenseActions, type ExpenseAction } from "../utils/expenseActions";
import {
  computeTotals,
  getAddPermission,
  type AddPermission,
  type ExpenseRecord,
  type ExpenseTotals,
} from "../utils/expenses";

export type HistoryDateGroup = {
  dateLabel: string;
  items: HistoryItem[];
};

export type ExpenseStatusState = "idle" | "loading" | "ready" | "error";

export type AddExpenseValues = {
  categoryId: ExpenseCategoryId;
  amountText: string;
  dateText: string;
  paidBy: string | null;
  splitAmong: string[];
  note: string;
};

/** What an edit can change. The status and ownership of an expense are never edited. */
export type UpdateExpenseValues = {
  categoryId: ExpenseCategoryId;
  /** Raw text from the amount field, e.g. "20,000". */
  amountText: string;
  /** Raw DD/MM/YY or DD/MM/YYYY text. */
  dateText: string;
  /** memberId who paid. */
  paidBy: string;
  note: string;
  /** The memberIds to split between. Leave undefined to keep the expense's current split. */
  splitAmong?: string[];
};

type ExpenseContextValue = {
  status: ExpenseStatusState;
  expenses: ExpenseRecord[];
  totals: ExpenseTotals;
  totalSpent: number;
  historyGroups: HistoryDateGroup[];
  loading: boolean;
  permission: AddPermission;
  addExpense: (values: AddExpenseValues | any) => Promise<any>;
  approveExpense: (expenseId: string) => Promise<void>;
  /** What the signed-in user may do with this expense (current month only). */
  getActions: (expense: ExpenseRecord) => ExpenseAction[];
  /** Edits category, amount, payer, date, note and (optionally) the split. Throws ExpenseError. */
  updateExpense: (expense: ExpenseRecord, values: UpdateExpenseValues) => Promise<void>;
  /** Deletes an expense: the admin declines/deletes, a member withdraws their own Pending one. */
  deleteExpense: (expense: ExpenseRecord) => Promise<void>;
  /** Last month's SHARED spending, or null if it couldn't be read. */
  loadPreviousMonthSpent: () => Promise<number | null>;
};

const NO_EXPENSES: ExpenseRecord[] = [];

function formatGroupDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(
  undefined,
);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const { family, activeMembers, currentMember, members, isAdmin } =
    useFamily();
  const { budget, monthKey } = useBudget();

  const uid = isSignedIn && user ? user.uid : null;
  const familyId = uid ? (family?.id ?? null) : null;
  const key = uid && familyId ? `${uid}:${familyId}:${monthKey}` : null;

  const [synced, setSynced] = useState<{
    key: string | null;
    expenses: ExpenseRecord[];
    state: "loading" | "ready" | "error";
  }>({
    key: null,
    expenses: [],
    state: "loading",
  });

  useEffect(() => {
    if (!key || !familyId) {
      return;
    }

    const unsubscribe = subscribeToExpenses(familyId, monthKey, (event) => {
      if (event.status === "ready") {
        setSynced({ key, expenses: event.expenses, state: "ready" });
      } else {
        console.warn("[expenses] expense listener failed", event.error);
        setSynced({ key, expenses: [], state: "error" });
      }
    });

    return unsubscribe;
  }, [key, familyId, monthKey]);

  const isCurrent = Boolean(key && synced.key === key);
  const status: ExpenseStatusState = !key
    ? "idle"
    : isCurrent
      ? synced.state
      : "loading";
  const expenses = isCurrent ? synced.expenses : NO_EXPENSES;
  const loading = !key || !isCurrent || status === "loading";

  const totals = useMemo(() => computeTotals(expenses), [expenses]);
  const totalSpent = totals.spent;

  const permission = useMemo(
    () => getAddPermission({ isAdmin, member: currentMember, budget }),
    [isAdmin, currentMember, budget],
  );

  const historyGroups = useMemo<HistoryDateGroup[]>(() => {
    if (expenses.length === 0) {
      return [];
    }

    const groupsMap = new Map<string, HistoryItem[]>();

    expenses.forEach((exp: any) => {
      const dateObj = exp.date?.toDate
        ? exp.date.toDate()
        : exp.createdAt?.toDate
          ? exp.createdAt.toDate()
          : new Date(0);
      const groupKey = formatGroupDate(dateObj);
      const timeStr = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const member = members?.find((m) => m.id === exp.paidBy);
      const payerText = member
        ? `Paid by ${member.displayName}`
        : "Paid by member";

      const categoryMeta = getExpenseCategory(exp.categoryId);

      const historyItem: HistoryItem = {
        id: exp.id,
        title: exp.title,
        category: categoryMeta.label as any,
        time: timeStr,
        payerText,
        amount: exp.amount,
        status: exp.status || "Shared",
        iconBg: categoryMeta.iconBackground,
        iconEmoji: categoryMeta.emoji,
        receiptUri: exp.receiptUri || null,
        note: exp.note || null,
      };

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey)!.push(historyItem);
    });

    return Array.from(groupsMap.entries()).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    }));
  }, [expenses, members]);

  const addExpense = useCallback(
    (values: any) => {
      if (!uid || !familyId) {
        return Promise.reject(
          new Error("Your family hasn't loaded yet. Please try again."),
        );
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

  const getActions = useCallback(
    (expense: ExpenseRecord) =>
      getExpenseActions({
        isAdmin,
        isOwnExpense: !!uid && expense.createdBy === uid,
        status: expense.status,
        isCurrentMonth: expense.monthKey === getMonthKey(),
        canAddExpenses: currentMember?.canAddExpenses === true,
      }),
    [isAdmin, uid, currentMember],
  );

  const updateExpense = useCallback(
    (expense: ExpenseRecord, values: UpdateExpenseValues) => {
      if (!uid) return Promise.reject(new Error("Your family hasn't loaded yet. Please try again."));
      return updateExpenseDocument({ expense, uid, isAdmin, member: currentMember, activeMembers, ...values });
    },
    [uid, isAdmin, currentMember, activeMembers],
  );

  const deleteExpense = useCallback(
    (expense: ExpenseRecord) => {
      if (!uid) return Promise.reject(new Error("Your family hasn't loaded yet. Please try again."));
      return deleteExpenseDocument({ expense, uid, isAdmin, member: currentMember });
    },
    [uid, isAdmin, currentMember],
  );

  const loadPreviousMonthSpent = useCallback(
    async () =>
      familyId ? getMonthSpent(familyId, getPreviousMonthKey(monthKey)) : null,
    [familyId, monthKey],
  );

  const value = useMemo<ExpenseContextValue>(
    () => ({
      status,
      expenses,
      totals,
      totalSpent,
      historyGroups,
      loading,
      permission,
      addExpense,
      approveExpense,
      getActions,
      updateExpense,
      deleteExpense,
      loadPreviousMonthSpent,
    }),
    [
      status,
      expenses,
      totals,
      totalSpent,
      historyGroups,
      loading,
      permission,
      addExpense,
      approveExpense,
      getActions,
      updateExpense,
      deleteExpense,
      loadPreviousMonthSpent,
    ],
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

export function useExpenses(): ExpenseContextValue {
  const value = useContext(ExpenseContext);
  if (!value) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return value;
}
