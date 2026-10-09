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

/**
 * Something MemberSelector can show. The mock `Member` above (Bills and Savings still use it)
 * has a picture; real family members have initials instead.
 */
export type SelectableMember = {
  key: string;
  name: string;
  avatar?: ImageSourcePropType;
  initials?: string;
  avatarColor?: string;
  avatarTextColor?: string;
};

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
