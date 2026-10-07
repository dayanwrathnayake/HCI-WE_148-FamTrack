import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useFamily } from "./FamilyContext";
import {
  createRecurringBill,
  CreateRecurringBillInput,
  RecurringBillDoc,
  subscribeToFamilyBills,
  updateBillStatus,
} from "../services/billsService";

export type LiveRecurringBill = RecurringBillDoc & { id: string };

type BillsContextType = {
  bills: LiveRecurringBill[];
  upcomingBills: LiveRecurringBill[];
  paidBills: LiveRecurringBill[];
  totalCommitments: number;
  loading: boolean;
  addBill: (
    input: Omit<CreateRecurringBillInput, "familyId" | "createdBy">,
  ) => Promise<string>;
  markAsPaid: (billId: string, paidByText?: string) => Promise<void>;
};

const BillsContext = createContext<BillsContextType | undefined>(undefined);

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = family?.id ?? null;

  const [syncedState, setSyncedState] = useState<{
    familyId: string | null;
    bills: LiveRecurringBill[];
  }>({
    familyId: null,
    bills: [],
  });

  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = subscribeToFamilyBills(
      familyId,
      (liveBills) => {
        setSyncedState({ familyId, bills: liveBills });
      },
      () => {
        setSyncedState({ familyId, bills: [] });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [familyId]);

  const bills = useMemo(
    () =>
      familyId && syncedState.familyId === familyId ? syncedState.bills : [],
    [familyId, syncedState],
  );

  const loading = Boolean(familyId && syncedState.familyId !== familyId);

  const upcomingBills = useMemo(
    () => bills.filter((b) => b.status !== "PAID"),
    [bills],
  );

  const paidBills = useMemo(
    () => bills.filter((b) => b.status === "PAID"),
    [bills],
  );

  const totalCommitments = useMemo(
    () => bills.reduce((sum, b) => sum + (b.amount || 0), 0),
    [bills],
  );

  const addBill = useCallback(
    async (
      input: Omit<CreateRecurringBillInput, "familyId" | "createdBy">,
    ): Promise<string> => {
      if (!familyId || !user) {
        throw new Error(
          "You must be part of a family to create a recurring bill.",
        );
      }

      return createRecurringBill({
        ...input,
        familyId,
        createdBy: user.uid,
      });
    },
    [familyId, user],
  );

  const markAsPaid = useCallback(
    async (billId: string, paidByText?: string): Promise<void> => {
      await updateBillStatus(billId, "PAID", paidByText);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({
      bills,
      upcomingBills,
      paidBills,
      totalCommitments,
      loading,
      addBill,
      markAsPaid,
    }),
    [
      bills,
      upcomingBills,
      paidBills,
      totalCommitments,
      loading,
      addBill,
      markAsPaid,
    ],
  );

  return (
    <BillsContext.Provider value={contextValue}>
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
