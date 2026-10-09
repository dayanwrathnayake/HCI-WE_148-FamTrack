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
  createSavingGoal,
  CreateSavingGoalInput,
  deleteSavingGoal,
  SavingGoalDoc,
  subscribeToFamilySavingGoals,
} from "../services/savingsService";

export type LiveSavingGoal = SavingGoalDoc & { id: string };

type SavingsContextType = {
  goals: LiveSavingGoal[];
  totalSavings: number;
  loading: boolean;
  addGoal: (
    input: Omit<CreateSavingGoalInput, "familyId" | "createdBy">,
  ) => Promise<string>;
  deleteGoal: (goalId: string) => Promise<void>;
};

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { family } = useFamily();
  const familyId = family?.id ?? null;

  const [syncedState, setSyncedState] = useState<{
    familyId: string | null;
    goals: LiveSavingGoal[];
  }>({
    familyId: null,
    goals: [],
  });

  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = subscribeToFamilySavingGoals(
      familyId,
      (liveGoals) => {
        setSyncedState({ familyId, goals: liveGoals });
      },
      () => {
        setSyncedState({ familyId, goals: [] });
      },
    );

    return () => {
      unsubscribe();
    };
  }, [familyId]);

  const goals = useMemo(
    () =>
      familyId && syncedState.familyId === familyId ? syncedState.goals : [],
    [familyId, syncedState],
  );

  const loading = Boolean(familyId && syncedState.familyId !== familyId);

  const totalSavings = useMemo(
    () => goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0),
    [goals],
  );

  const addGoal = useCallback(
    async (
      input: Omit<CreateSavingGoalInput, "familyId" | "createdBy">,
    ): Promise<string> => {
      if (!familyId || !user) {
        throw new Error(
          "You must be part of a family to create a saving goal.",
        );
      }

      return createSavingGoal({
        ...input,
        familyId,
        createdBy: user.uid,
      });
    },
    [familyId, user],
  );

  const deleteGoal = useCallback(async (goalId: string): Promise<void> => {
    await deleteSavingGoal(goalId);
  }, []);

  const contextValue = useMemo(
    () => ({ goals, totalSavings, loading, addGoal, deleteGoal }),
    [goals, totalSavings, loading, addGoal, deleteGoal],
  );

  return (
    <SavingsContext.Provider value={contextValue}>
      {children}
    </SavingsContext.Provider>
  );
}

export function useSavings() {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error("useSavings must be used within a SavingsProvider");
  }
  return context;
}
