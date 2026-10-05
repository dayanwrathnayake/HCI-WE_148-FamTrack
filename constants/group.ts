import { ImageSourcePropType } from "react-native";
export type MemberAccessType = "FULL ACCESS" | "LIMITED";

export type GroupMemberControl = {
  id: string;
  name: string;
  roleDescription: string;
  accessType: MemberAccessType;
  limitText?: string;
  spentAmountText?: string;
  spentPercentage?: number;
  avatar: ImageSourcePropType;
  email?: string;
};

export const INITIAL_ADMIN = {
  name: "Kamal Perera",
  role: "FAMILY ADMIN",
  email: "kamalperera@gmail.com",
  avatar: require("../assets/onboarding/avatar1.png"),
};

export const INITIAL_GROUP_MEMBERS: GroupMemberControl[] = [
  {
    id: "mem_1",
    name: "Amali",
    roleDescription: "Mom",
    accessType: "FULL ACCESS",
    spentAmountText: "Rs 160,000",
    avatar: require("../assets/onboarding/avatar4.png"),
    email: "amali@gmail.com",
  },
  {
    id: "mem_2",
    name: "Nimal",
    roleDescription: "Son",
    accessType: "LIMITED",
    limitText: "LIMIT: RS 15,000/MO",
    spentPercentage: 0.75,
    avatar: require("../assets/onboarding/avatar3.png"),
    email: "nimal@gmail.com",
  },
  {
    id: "mem_3",
    name: "Dad",
    roleDescription: "Dad",
    accessType: "LIMITED",
    limitText: "LIMIT: RS 10,000/MO",
    spentPercentage: 0.42,
    avatar: require("../assets/onboarding/avatar2.png"),
    email: "dad@gmail.com",
  },
];
