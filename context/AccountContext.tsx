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
  accountDeleted: boolean;
  deleteAccount: () => void;
  createAccount: (name: string, email: string) => void;
} | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accountDeleted, setAccountDeleted] = useState(false);
  const [account, updateAccount] = useState<Account>({
    name: INITIAL_ADMIN.name,
    email: INITIAL_ADMIN.email,
    phone: "+94702149158",
    avatar: INITIAL_ADMIN.avatar,
  });
  const deleteAccount = () => {
    updateAccount({ name: "", email: "", phone: "", avatar: INITIAL_ADMIN.avatar });
    setAccountDeleted(true);
  };
  const createAccount = (name: string, email: string) => {
    updateAccount({ name, email, phone: "", avatar: INITIAL_ADMIN.avatar });
    setAccountDeleted(false);
  };
  return <AccountContext.Provider value={{ account, updateAccount, accountDeleted, deleteAccount, createAccount }}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount must be used within an AccountProvider");
  return context;
}
