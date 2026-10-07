import { createContext, useContext, useState, type ReactNode } from "react";
import { type IncomeEntry, localDate } from "../constants/income";
import { useNotifications } from "./NotificationContext";

const IncomeContext = createContext<{ entries: IncomeEntry[]; addIncome: (entry: Omit<IncomeEntry, "id">) => void } | undefined>(undefined);
export function IncomeProvider({ children }: { children: ReactNode }) {
  const { addNotification } = useNotifications();
  const [entries, setEntries] = useState<IncomeEntry[]>(() => {
    const today = localDate();
    const previous = localDate(new Date(new Date().getFullYear(), new Date().getMonth(), Math.max(1, new Date().getDate() - 1)));
    return [
      { id: "salary", title: "Monthly Salary", amount: 150000, source: "Salary", member: "Kamal", date: today, status: "Received", familyBudget: true, repeatMonthly: true },
      { id: "business", title: "Freelance project", amount: 28000, source: "Business", member: "Nimal", date: today, status: "Received", familyBudget: true, repeatMonthly: false },
      { id: "rental", title: "Annex rent", amount: 47000, source: "Rental", member: "Mum", date: previous, status: "Received", familyBudget: true, repeatMonthly: true },
      { id: "interest", title: "FD interest", amount: 15000, source: "Interest", member: "Dad", date: previous, status: "Expected", familyBudget: true, repeatMonthly: false },
    ];
  });
  const addIncome = (entry: Omit<IncomeEntry, "id">) => {
    setEntries(previous => [{ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }, ...previous]);
    addNotification({ title: entry.title, detail: entry.status === "Received" ? "Income received" : "Income expected", amount: entry.amount, kind: "income", emoji: "💵" });
  };
  return <IncomeContext.Provider value={{ entries, addIncome }}>{children}</IncomeContext.Provider>;
}
export function useIncome() {
  const context = useContext(IncomeContext);
  if (!context) throw new Error("useIncome must be used within an IncomeProvider");
  return context;
}
