import React, { createContext, useContext, useState } from "react";
import { ImageSourcePropType } from "react-native";
import {
  BillCategory,
  BillItem,
  MOCK_PAID_BILLS,
  MOCK_UPCOMING_BILLS,
} from "../constants/bills";

export type NewBillInput = {
  title: string;
  category: BillCategory;
  amount: number;
  dueDateText: string;
  isAutoPay: boolean;
  assignedAvatar?: ImageSourcePropType;
  iconEmoji: string;
  iconBg: string;
};

type BillsContextType = {
  upcomingBills: BillItem[];
  paidBills: BillItem[];
  totalCommitments: number;
  addBill: (bill: NewBillInput) => void;
};

const BillsContext = createContext<BillsContextType | undefined>(undefined);

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const [upcomingBills, setUpcomingBills] =
    useState<BillItem[]>(MOCK_UPCOMING_BILLS);
  const [paidBills, setPaidBills] = useState<BillItem[]>(MOCK_PAID_BILLS);

  const totalCommitments =
    upcomingBills.reduce((sum, b) => sum + b.amount, 0) +
    paidBills.reduce((sum, b) => sum + b.amount, 0);

  const addBill = (input: NewBillInput) => {
    const newBill: BillItem = {
      id: `bill_${Date.now()}`,
      title: input.title,
      category: input.category,
      dueText: input.isAutoPay ? "Auto-debit" : "Due in 5 days",
      dateText: input.dueDateText || "End of Month",
      amount: input.amount,
      status: input.isAutoPay ? "AUTO-PAY" : "UNPAID",
      iconBg: input.iconBg,
      iconEmoji: input.iconEmoji,
      assignedAvatar: input.assignedAvatar,
    };

    setUpcomingBills((prev) => [newBill, ...prev]);
  };

  return (
    <BillsContext.Provider
      value={{ upcomingBills, paidBills, totalCommitments, addBill }}
    >
      {children}
    </BillsContext.Provider>
  );
}

export function useBills() {
  const context = useContext(BillsContext);
  if (!context) {
    throw new Error("useBills must be used within a BillsProvider");
  }
  return context;
}
