import { ImageSourcePropType } from "react-native";
import { ALL_MEMBERS } from "./expense";

export type SavingGoal = {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  iconBg: string;
  iconEmoji: string;
  contributorAvatars: ImageSourcePropType[];
};

export const MOCK_SAVINGS_SUMMARY = {
  totalSavings: 450000,
  monthlyGrowthPercent: "+ 12.5%",
};

export const MOCK_SAVING_GOALS: SavingGoal[] = [
  {
    id: "goal_1",
    title: "Emergency Vault",
    targetAmount: 300000,
    savedAmount: 210000,
    iconBg: "#e2e8f0",
    iconEmoji: "🗄️",
    contributorAvatars: ALL_MEMBERS.map((m) => m.avatar),
  },
  {
    id: "goal_2",
    title: "Annual Vacation",
    targetAmount: 150000,
    savedAmount: 90000,
    iconBg: "#bae6fd",
    iconEmoji: "🏖️",
    contributorAvatars: ALL_MEMBERS.map((m) => m.avatar),
  },
  {
    id: "goal_3",
    title: "New Family Car",
    targetAmount: 1200000,
    savedAmount: 150000,
    iconBg: "#fef08a",
    iconEmoji: "🚗",
    contributorAvatars: ALL_MEMBERS.slice(0, 3).map((m) => m.avatar),
  },
];
