import { ImageSourcePropType } from "react-native";
import { ALL_MEMBERS } from "./expense";

export type BillStatus = "UNPAID" | "AUTO-PAY" | "PAID";
export type BillCategory = "Utilities" | "Entertainment";

export type BillItem = {
  id: string;
  title: string;
  category: BillCategory;
  dueText: string;
  dateText: string;
  amount: number;
  status: BillStatus;
  iconBg: string;
  iconEmoji: string;
  assignedAvatar?: ImageSourcePropType;
  paidByText?: string;
};

export const BILL_SUMMARY = {
  totalCommitments: 32500,
  nextDueAlert: "Next due in 3 days: Home Fiber",
};

export const BILL_CATEGORIES = [
  { key: "all", label: "All Bills (6)" },
  { key: "utilities", label: "Utilities (3)" },
  { key: "entertainment", label: "Entertainment (3)" },
] as const;

export type BillCategoryFilter = (typeof BILL_CATEGORIES)[number]["key"];

export const MOCK_UPCOMING_BILLS: BillItem[] = [
  {
    id: "bill_1",
    title: "SLT Fiber Broadband",
    category: "Utilities",
    dueText: "Due in 3 days",
    dateText: "22 Sep",
    amount: 4890,
    status: "UNPAID",
    iconBg: "#e0f2fe",
    iconEmoji: "📶",
    assignedAvatar: ALL_MEMBERS[1]?.avatar,
  },
  {
    id: "bill_2",
    title: "CEB Electricity Bill",
    category: "Utilities",
    dueText: "Due in 8 days",
    dateText: "27 Sep",
    amount: 18200,
    status: "UNPAID",
    iconBg: "#fef3c7",
    iconEmoji: "⚡",
    assignedAvatar: ALL_MEMBERS[2]?.avatar,
  },
  {
    id: "bill_3",
    title: "Netflix Family Premium",
    category: "Entertainment",
    dueText: "Auto-debit",
    dateText: "28 Sep",
    amount: 3600,
    status: "AUTO-PAY",
    iconBg: "#fee2e2",
    iconEmoji: "📺",
    assignedAvatar: ALL_MEMBERS[0]?.avatar,
  },
];

export const MOCK_PAID_BILLS: BillItem[] = [
  {
    id: "bill_4",
    title: "National Water Board",
    category: "Utilities",
    dueText: "Paid",
    dateText: "12 Sep",
    amount: 2450,
    status: "PAID",
    iconBg: "#e0f2fe",
    iconEmoji: "💧",
    paidByText: "Paid on 12 Sep by Sarah",
  },
  {
    id: "bill_5",
    title: "Dialog Home TV",
    category: "Entertainment",
    dueText: "Paid",
    dateText: "23 Sep",
    amount: 1500,
    status: "PAID",
    iconBg: "#dcfce7",
    iconEmoji: "🖥️",
    paidByText: "Paid on 23 Sep by Sarah",
  },
];
