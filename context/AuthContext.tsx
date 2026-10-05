import type { User } from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { isAuthFlowActive, subscribeToAuthFlow } from "../lib/authFlow";
import { signOutUser, subscribeToAuthState } from "../services/authService";
import { isRestoredSessionValid } from "../services/sessionService";

type AuthContextValue = {
  /** The Firebase user, or null when signed out. May be set while a register/login is still finishing. */
  user: User | null;
  /** What route guards should use: a user exists AND no register/login flow is still running. */
  isSignedIn: boolean;
  /** True only at launch, until the saved session has been restored and checked (or ruled out). */
  initializing: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const flowActive = useSyncExternalStore(subscribeToAuthFlow, isAuthFlowActive, isAuthFlowActive);

  useEffect(() => {
    let active = true;
    let firstEvent = true;

    const unsubscribe = subscribeToAuthState((nextUser) => {
      if (!active) return;
      setUser(nextUser);

      // Only the first event is the restored-session event; later ones are normal sign-in/out.
      if (!firstEvent) return;
      firstEvent = false;

      if (!nextUser || isAuthFlowActive()) {
        setInitializing(false);
        return;
      }

      // A saved session exists. Sign it out only if its profile is CONFIRMED missing;
      // a failed or slow read must never sign out a returning user. Always stop initializing.
      isRestoredSessionValid(nextUser.uid)
        .then((valid) => (valid ? undefined : signOutUser()))
        .catch(() => undefined)
        .finally(() => {
          if (active) setInitializing(false);
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(() => signOutUser(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isSignedIn: !initializing && user !== null && !flowActive,
      initializing,
      signOut,
    }),
    [user, initializing, flowActive, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return value;
}
