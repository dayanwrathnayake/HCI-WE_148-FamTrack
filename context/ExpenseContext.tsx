import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useFamily } from "./FamilyContext";
import {
  CATEGORY_ICONS,
  HistoryDateGroup,
  HistoryItem,
  MOCK_HISTORY_GROUPS,
} from "../constants/history";
import {
  createExpense,
  CreateExpenseInput,
  subscribeToFamilyExpenses,
} from "../services/expenseService";
import type { Expense, WithId } from "../types/models";

type ExpenseContextType = {
  expenses: WithId<Expense>[];
  historyGroups: HistoryDateGroup[];
  totalSpent: number;
  loading: boolean;
  addExpense: (
    input: Omit<CreateExpenseInput, "familyId" | "createdBy">,
  ) => Promise<string>;
};

type ExpensesState = {
  familyId: string | null;
  expenses: WithId<Expense>[];
  loading: boolean;
};

const INITIAL_STATE: ExpensesState = {
  familyId: null,
  expenses: [],
  loading: false,
};

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

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { family, members } = useFamily();
  const familyId = family?.id ?? null;

  const [state, setState] = useState<ExpensesState>(INITIAL_STATE);

  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = subscribeToFamilyExpenses(
      familyId,
      (liveExpenses) => {
        setState({ familyId, expenses: liveExpenses, loading: false });
      },
      () => {
        setState({ familyId, expenses: [], loading: false });
      },
    );

    return () => unsubscribe();
  }, [familyId]);

  const expenses = useMemo(
    () => (state.familyId === familyId ? state.expenses : []),
    [state.familyId, state.expenses, familyId],
  );

  const loading = familyId
    ? state.familyId === familyId
      ? state.loading
      : true
    : false;

  const totalSpent = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );

  const historyGroups = useMemo<HistoryDateGroup[]>(() => {
    if (expenses.length === 0) {
      return !familyId ? MOCK_HISTORY_GROUPS : [];
    }

    const groupsMap = new Map<string, HistoryItem[]>();

    expenses.forEach((exp) => {
      const dateObj = exp.date?.toDate ? exp.date.toDate() : new Date();
      const groupKey = formatGroupDate(dateObj);
      const timeStr = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const member = members.find((m) => m.id === exp.paidBy);
      const payerText = member
        ? `Paid by ${member.displayName}`
        : "Paid by member";

      const categoryConfig = CATEGORY_ICONS[exp.categoryId] ||
        CATEGORY_ICONS[exp.title] || {
          emoji: "💸",
          bg: "#10b981",
        };

      const historyItem: HistoryItem = {
        id: exp.id,
        title: exp.title,
        category: (exp.categoryId as any) || "Food",
        time: timeStr,
        payerText,
        amount: exp.amount,
        status: exp.status || "Shared",
        iconBg: categoryConfig.bg,
        iconEmoji: categoryConfig.emoji,
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
  }, [expenses, familyId, members]);

  const addExpense = async (
    input: Omit<CreateExpenseInput, "familyId" | "createdBy">,
  ): Promise<string> => {
    if (!familyId || !user) {
      throw new Error("You must be part of a family to add expenses.");
    }

    return createExpense({
      ...input,
      familyId,
      createdBy: user.uid,
    });
  };

  return (
    <ExpenseContext.Provider
      value={{ expenses, historyGroups, totalSpent, loading, addExpense }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
}
