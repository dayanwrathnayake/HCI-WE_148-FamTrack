import { ImageSourcePropType } from "react-native";

export type CategoryOption = {
  key: string;
  emoji: string;
  label: string;
};

export type Member = {
  key: string;
  name: string;
  avatar: ImageSourcePropType;
};

export const CATEGORIES: CategoryOption[] = [
  { key: "food", emoji: "🍔", label: "Food" },
  { key: "groceries", emoji: "🛒", label: "Groceries" },
  { key: "transport", emoji: "🚗", label: "Transport" },
  { key: "bills", emoji: "💡", label: "Bills" },
  { key: "entertainment", emoji: "🎬", label: "Entertainment" },
  { key: "health", emoji: "💊", label: "Health" },
  { key: "other", emoji: "📦", label: "Other" },
];

export const ALL_MEMBERS: Member[] = [
  {
    key: "amali",
    name: "Amali",
    avatar: require("../assets/onboarding/avatar1.png"),
  },
  {
    key: "ishan",
    name: "Ishan",
    avatar: require("../assets/onboarding/avatar2.png"),
  },
  {
    key: "nimal",
    name: "Nimal",
    avatar: require("../assets/onboarding/avatar3.png"),
  },
  {
    key: "gayani",
    name: "Gayani",
    avatar: require("../assets/onboarding/avatar4.png"),
  },
];
