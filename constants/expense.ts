import { ImageSourcePropType } from "react-native";

export type Member = {
  key: string;
  name: string;
  avatar: ImageSourcePropType;
};

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
