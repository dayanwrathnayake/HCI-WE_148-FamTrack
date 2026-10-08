import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  amount: number;
  kind: "income" | "expense" | "bill";
  emoji: string;
  createdAt: string;
  read: boolean;
};
type NotificationInput = Omit<AppNotification, "id" | "createdAt" | "read">;
const NotificationContext = createContext<{
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (input: NotificationInput) => void;
  markAllRead: () => void;
} | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => [
    { title: "Electricity bill", detail: "Bill reminder", amount: 3402.56, kind: "bill", emoji: "💡" },
    { title: "Salary", detail: "Income received", amount: 50402, kind: "income", emoji: "💵" },
    { title: "Taxi", detail: "Expense recorded", amount: 500, kind: "expense", emoji: "🚕" },
    { title: "Doctor", detail: "Expense recorded", amount: 5040.9, kind: "expense", emoji: "🩺" },
    { title: "Grocery", detail: "Expense recorded", amount: 2022.56, kind: "expense", emoji: "🛒" },
    { title: "Shopping", detail: "Expense recorded", amount: 8940.56, kind: "expense", emoji: "🛍️" },
  ].map((item, index) => ({ ...item, kind: item.kind as AppNotification["kind"], id: `sample-${index}`, createdAt: new Date(Date.now() - index * 86400000).toISOString(), read: index > 1 })));
  const addNotification = useCallback((input: NotificationInput) => {
    setNotifications(previous => [{ ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString(), read: false }, ...previous]);
  }, []);
  const markAllRead = useCallback(() => setNotifications(previous => previous.map(item => item.read ? item : { ...item, read: true })), []);
  return <NotificationContext.Provider value={{ notifications, unreadCount: notifications.filter(item => !item.read).length, addNotification, markAllRead }}>{children}</NotificationContext.Provider>;
}
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
  return context;
}
