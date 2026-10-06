import React, { createContext, useContext, useState } from "react";
import { ImageSourcePropType } from "react-native";
import {
  MOCK_SAVING_GOALS,
  MOCK_SAVINGS_SUMMARY,
  SavingGoal,
} from "../constants/savings";

export type NewGoalInput = {
  title: string;
  targetAmount: number;
  initialDeposit?: number;
  iconEmoji: string;
  iconBg: string;
  contributors: ImageSourcePropType[];
};

type SavingsContextType = {
  goals: SavingGoal[];
  totalSavings: number;
  addGoal: (goal: NewGoalInput) => void;
};

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<SavingGoal[]>(MOCK_SAVING_GOALS);

  const totalSavings =
    MOCK_SAVINGS_SUMMARY.totalSavings +
    goals
      .slice(MOCK_SAVING_GOALS.length)
      .reduce((sum, g) => sum + g.savedAmount, 0);

  const addGoal = (input: NewGoalInput) => {
    const newGoal: SavingGoal = {
      id: `goal_${Date.now()}`,
      title: input.title,
      targetAmount: input.targetAmount,
      savedAmount: input.initialDeposit || 0,
      iconBg: input.iconBg,
      iconEmoji: input.iconEmoji,
      contributorAvatars: input.contributors,
    };

    setGoals((prev) => [newGoal, ...prev]);
  };

  return (
    <SavingsContext.Provider value={{ goals, totalSavings, addGoal }}>
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
