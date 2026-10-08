import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { type IncomeEntry, type IncomeInput, localDate } from "../constants/income";
import { createIncome, deleteIncomeRecord, incomeErrorMessage, subscribeToIncome, updateIncomeRecord } from "../services/incomeService";
import { useAuth } from "./AuthContext";
import { useFamily } from "./FamilyContext";

type IncomeStatus = "idle" | "loading" | "ready" | "error" | "no-family";
type IncomeValue = {
  entries: IncomeEntry[]; status: IncomeStatus; error: string; monthKey: string;
  selectMonth: (month: string) => void; retryIncome: () => void;
  addIncome: (input: IncomeInput) => Promise<string>;
  updateIncome: (entry: IncomeEntry, input: IncomeInput) => Promise<void>;
  deleteIncome: (entry: IncomeEntry) => Promise<void>;
};
const IncomeContext = createContext<IncomeValue | undefined>(undefined);
export function IncomeProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, profileStatus } = useAuth();
  const { family, currentMember, status: familyStatus } = useFamily();
  const [monthKey, setMonthKey] = useState(() => localDate().slice(0, 7));
  const [attempt, setAttempt] = useState(0);
  const familyId = familyStatus === "ready" && currentMember?.status === "active" ? family?.id : undefined;
  const key = isSignedIn && user && familyId ? `${user.uid}:${familyId}:${monthKey}:${attempt}` : null;
  const [loaded, setLoaded] = useState<{ key: string | null; status: "ready" | "error"; entries: IncomeEntry[]; error: string }>({ key: null, status: "ready", entries: [], error: "" });
  useEffect(() => {
    if (!key || !familyId) return;
    let active = true;
    const unsubscribe = subscribeToIncome(familyId, monthKey, event => {
      if (!active) return;
      setLoaded(event.status === "ready" ? { key, status: "ready", entries: event.entries, error: "" } : { key, status: "error", entries: [], error: incomeErrorMessage(event.error) });
    });
    return () => { active = false; unsubscribe(); };
  }, [key, familyId, monthKey]);
  const ready = key !== null && loaded.key === key;
  const status: IncomeStatus = !isSignedIn ? "idle" : profileStatus === "error" || familyStatus === "error" ? "error" : profileStatus === "missing" || familyStatus === "missing" || (familyStatus === "ready" && !familyId) ? "no-family" : !key || !ready ? "loading" : loaded.status;
  const retryIncome = useCallback(() => setAttempt(value => value + 1), []);
  const selectMonth = useCallback((month: string) => { if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) setMonthKey(month); }, []);
  const requireFamily = () => {
    if (!familyId || !currentMember || !user || !isSignedIn) throw new Error("Your active family membership must load before saving income.");
    return { familyId, memberId: currentMember.id };
  };
  const addIncome = async (input: IncomeInput) => { const scope = requireFamily(); return createIncome(scope.familyId, scope.memberId, input); };
  const updateIncome = async (entry: IncomeEntry, input: IncomeInput) => { const scope = requireFamily(); if (entry.familyId !== scope.familyId) throw new Error("Your family changed. Reopen income history."); await updateIncomeRecord(entry, input); };
  const deleteIncome = async (entry: IncomeEntry) => { const scope = requireFamily(); if (entry.familyId !== scope.familyId) throw new Error("Your family changed. Reopen income history."); await deleteIncomeRecord(entry); };
  return <IncomeContext.Provider value={{ entries: ready && status === "ready" ? loaded.entries : [], status, error: ready ? loaded.error : "Could not load your family. Retry your profile/family connection.", monthKey, selectMonth, retryIncome, addIncome, updateIncome, deleteIncome }}>{children}</IncomeContext.Provider>;
}
export function useIncome() { const value = useContext(IncomeContext); if (!value) throw new Error("useIncome must be used within an IncomeProvider"); return value; }
