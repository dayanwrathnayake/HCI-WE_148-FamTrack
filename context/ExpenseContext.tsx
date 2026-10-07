import React, { createContext, useContext, useState } from "react";
import { expenseDate } from "../utils/expenseDates";
import { useNotifications } from "./NotificationContext";
import {
  HistoryItem,
  MOCK_HISTORY_GROUPS,
  CATEGORY_ICONS,
} from "../constants/history";

export type NewExpenseInput = {
  title: string;
  category: "Food" | "Utilities" | "Transport" | "Housing" | "Bills" | "Rent";
  amount: number;
  date?: string;
  payerText: string;
  note?: string;
  receiptUri?: string | null;
  status?: "Shared" | "Personal" | "Pending";
  iconEmoji?: string;
  iconBg?: string;
};

type ExpenseContextType = {
  historyGroups: typeof MOCK_HISTORY_GROUPS;
  totalSpent: number;
  addExpense: (expense: NewExpenseInput) => void;
};

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { addNotification } = useNotifications();
  const [historyGroups, setHistoryGroups] = useState(() => MOCK_HISTORY_GROUPS.map(group => ({ ...group, items: group.items.map(item => ({ ...item, date: expenseDate(group.dateLabel) })) })));

  const totalSpent = historyGroups.reduce((total, group) => {
    return total + group.items.reduce((sum, item) => sum + item.amount, 0);
  }, 0);

  const addExpense = (input: NewExpenseInput) => {
    const iconConfig = CATEGORY_ICONS[input.category] || {
      emoji: input.iconEmoji || "💸",
      bg: input.iconBg || "#10b981",
    };

    const newItem: HistoryItem & { date: string } = {
      date: expenseDate(input.date),
      id: Date.now().toString(),
      title: input.title,
      category: input.category,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      payerText: input.payerText || "Paid by you",
      amount: input.amount,
      status: input.status || "Shared",
      iconBg: iconConfig.bg,
      iconEmoji: iconConfig.emoji,
    };

    addNotification({ title: input.title, detail: "Expense recorded", amount: input.amount, kind: "expense", emoji: iconConfig.emoji });
    setHistoryGroups((prevGroups) => {
      const todayGroupIndex = prevGroups.findIndex(
        (g) => g.dateLabel === "Today",
      );

      if (todayGroupIndex >= 0) {
        const updated = [...prevGroups];
        updated[todayGroupIndex] = {
          ...updated[todayGroupIndex],
          items: [newItem, ...updated[todayGroupIndex].items],
        };
        return updated;
      } else {
        return [{ dateLabel: "Today", items: [newItem] }, ...prevGroups];
      }
    });
  };

  return (
    <ExpenseContext.Provider value={{ historyGroups, totalSpent, addExpense }}>
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
