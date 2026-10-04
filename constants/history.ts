export type ExpenseStatus = "Shared" | "Personal" | "Pending";

export type HistoryItem = {
  id: string;
  title: string;
  category: "Food" | "Utilities" | "Transport" | "Housing" | "Bills" | "Rent";
  time: string;
  payerText: string;
  amount: number;
  status: ExpenseStatus;
  iconBg: string;
  iconEmoji: string;
};

export type HistoryDateGroup = {
  dateLabel: string;
  items: HistoryItem[];
};

export const HISTORY_CATEGORIES = [
  "All",
  "Food",
  "Bills",
  "Rent",
  "Transport",
] as const;

export type HistoryCategoryFilter = (typeof HISTORY_CATEGORIES)[number];

export const CATEGORY_ICONS: Record<string, { emoji: string; bg: string }> = {
  Food: { emoji: "🍔", bg: "#fbbf24" },
  Groceries: { emoji: "🛒", bg: "#10b981" },
  Utilities: { emoji: "⚡", bg: "#1d4ed8" },
  Transport: { emoji: "⛽", bg: "#f87171" },
  Bills: { emoji: "📶", bg: "#e9d5ff" },
  Rent: { emoji: "🏠", bg: "#93c5fd" },
  Housing: { emoji: "🏠", bg: "#93c5fd" },
  Entertainment: { emoji: "🎬", bg: "#a78bfa" },
  Health: { emoji: "💊", bg: "#f472b6" },
  Other: { emoji: "📦", bg: "#9ca3af" },
};

export const MOCK_HISTORY_GROUPS: HistoryDateGroup[] = [
  {
    dateLabel: "Today",
    items: [
      {
        id: "1",
        title: "Keells",
        category: "Food",
        time: "6:42 PM",
        payerText: "Paid by mom",
        amount: 8450,
        status: "Shared",
        iconBg: "#10b981",
        iconEmoji: "🛒",
      },
      {
        id: "2",
        title: "CEB Electricity",
        category: "Utilities",
        time: "9:42 AM",
        payerText: "Paid by dad",
        amount: 5450,
        status: "Shared",
        iconBg: "#1d4ed8",
        iconEmoji: "⚡",
      },
    ],
  },
  {
    dateLabel: "Yesterday",
    items: [
      {
        id: "3",
        title: "Fuel",
        category: "Transport",
        time: "7:52 PM",
        payerText: "Paid by you",
        amount: 7500,
        status: "Shared",
        iconBg: "#f87171",
        iconEmoji: "⛽",
      },
      {
        id: "4",
        title: "Pizza Hut",
        category: "Food",
        time: "1:12 PM",
        payerText: "Paid by sister",
        amount: 5950,
        status: "Personal",
        iconBg: "#fbbf24",
        iconEmoji: "🍕",
      },
    ],
  },
  {
    dateLabel: "16 sep 2026",
    items: [
      {
        id: "5",
        title: "Rent",
        category: "Rent",
        time: "11:12 AM",
        payerText: "Paid by dad",
        amount: 45000,
        status: "Shared",
        iconBg: "#93c5fd",
        iconEmoji: "🏠",
      },
      {
        id: "6",
        title: "Dialog / Internet",
        category: "Bills",
        time: "8:12 AM",
        payerText: "Paid by you",
        amount: 5950,
        status: "Pending",
        iconBg: "#e9d5ff",
        iconEmoji: "📶",
      },
    ],
  },
];
