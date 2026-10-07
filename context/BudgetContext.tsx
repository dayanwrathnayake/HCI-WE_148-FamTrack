import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";

import {
  getPreviousMonthPrefill,
  saveBudget as saveBudgetDocument,
  subscribeToBudget,
  BudgetError,
  type BudgetPrefill,
} from "../services/budgetService";
import type { Budget, CategoryShares, WithId } from "../types/models";
import { getBudgetId, getMonthKey, msUntilNextMonth } from "../utils/budget";
import { useAuth } from "./AuthContext";
import { useFamily } from "./FamilyContext";

// The ONE source of truth for the signed-in user's CURRENT MONTH family budget:
//   Firestore budgets/{familyId}_{YYYY-MM}  ->  budgetService  ->  this context
// The month is the device's local calendar month. Earlier months' documents are never read for
// display or overwritten; a new month simply starts with no budget until the admin saves one.

/**
 * idle     - not signed in or no family yet
 * loading  - waiting for this month's budget
 * ready    - this month's budget exists
 * none     - the server confirmed there is no budget for this month yet
 * error    - the listener failed
 */
export type BudgetStatus = "idle" | "loading" | "ready" | "none" | "error";

export type SaveBudgetValues = {
  name: string;
  /** Raw text from the amount field, e.g. "100,000". */
  amountText: string;
  alertPercentage: number;
  membersCanAddExpenses: boolean;
  categories: CategoryShares;
};

type BudgetContextValue = {
  status: BudgetStatus;
  /** This month's budget, or null when there is none (or while loading). */
  budget: WithId<Budget> | null;
  /** The current local month, "YYYY-MM". */
  monthKey: string;
  /** Document id of this month's budget (exists or not), or null without a family. */
  budgetId: string | null;
  /** Creates this month's budget or updates its editable fields. Throws BudgetError. */
  saveBudget: (values: SaveBudgetValues) => Promise<void>;
  /** The previous month's budget values, for pre-filling the form only. Never writes. */
  loadPrefill: () => Promise<BudgetPrefill | null>;
};

type Loaded = {
  key: string | null;
  budget: WithId<Budget> | null;
  state: "loading" | "ready" | "none" | "error";
};

const EMPTY: Loaded = { key: null, budget: null, state: "loading" };

// setTimeout cannot wait longer than ~24.8 days, so the month rollover is re-checked at least hourly.
const MAX_TIMER_MS = 60 * 60 * 1000;

/** The device's current local month key; re-evaluated at the month boundary and when the app returns to the foreground. */
function useCurrentMonthKey(): string {
  const [monthKey, setMonthKey] = useState(() => getMonthKey());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => setMonthKey(getMonthKey());
    const schedule = () => {
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, Math.min(msUntilNextMonth() + 1000, MAX_TIMER_MS));
    };
    schedule();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return monthKey;
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const { family, isAdmin } = useFamily();
  const monthKey = useCurrentMonthKey();

  const uid = isSignedIn && user ? user.uid : null;
  const familyId = uid ? (family?.id ?? null) : null;
  const budgetId = familyId ? getBudgetId(familyId, monthKey) : null;
  // Everything loaded below belongs to exactly one (user, budget) pair.
  const key = uid && budgetId ? `${uid}:${budgetId}` : null;

  const [loaded, setLoaded] = useState<Loaded>(EMPTY);

  useEffect(() => {
    if (!key || !budgetId) {
      setLoaded(EMPTY);
      return;
    }

    setLoaded({ ...EMPTY, key });
    const unsubscribe = subscribeToBudget(budgetId, (event) => {
      setLoaded((prev) => {
        if (prev.key !== key) return prev; // a newer user/month is already active
        if (event.status === "ready") return { key, budget: event.budget, state: "ready" };
        if (event.status === "none") return { key, budget: null, state: "none" };
        console.warn("[budget] budget listener failed", event.error);
        return { key, budget: null, state: "error" };
      });
    });

    return unsubscribe;
  }, [key, budgetId]);

  // Only data that belongs to the CURRENT user+month is exposed, so a previous account's (or
  // month's) budget can never appear, not even for one render while switching.
  const current = loaded.key === key ? loaded : EMPTY;
  const status: BudgetStatus = !key ? "idle" : current.state;

  const saveBudget = useCallback(
    async (values: SaveBudgetValues) => {
      if (!uid || !familyId) {
        throw new BudgetError("no-family", "Your family hasn't loaded yet. Please try again.");
      }
      return saveBudgetDocument({
        familyId,
        uid,
        isAdmin,
        monthKey,
        exists: current.state === "ready",
        ...values,
      });
    },
    [uid, familyId, isAdmin, monthKey, current.state],
  );

  const loadPrefill = useCallback(
    async () => (familyId ? getPreviousMonthPrefill(familyId, monthKey) : null),
    [familyId, monthKey],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({ status, budget: current.budget, monthKey, budgetId, saveBudget, loadPrefill }),
    [status, current.budget, monthKey, budgetId, saveBudget, loadPrefill],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextValue {
  const value = useContext(BudgetContext);
  if (!value) {
    throw new Error("useBudget must be used inside <BudgetProvider>");
  }
  return value;
}
