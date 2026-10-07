import { createContext, useContext, useState, type ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";
import { INITIAL_ADMIN } from "../constants/group";

type Account = {
  name: string;
  email: string;
  phone: string;
  avatar: ImageSourcePropType;
};

const AccountContext = createContext<{
  account: Account;
  updateAccount: (account: Account) => void;
} | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, updateAccount] = useState<Account>({
    name: INITIAL_ADMIN.name,
    email: INITIAL_ADMIN.email,
    phone: "+94702149158",
    avatar: INITIAL_ADMIN.avatar,
  });
  return <AccountContext.Provider value={{ account, updateAccount }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within an AccountProvider");
  return context;
}
