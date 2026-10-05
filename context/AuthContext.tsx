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
import { subscribeToUserProfile } from "../services/userService";
import type { UserProfile, WithId } from "../types/models";

/**
 * idle     - no signed-in user
 * loading  - listening, no answer yet
 * ready    - profile loaded
 * missing  - the server confirmed users/{uid} does not exist
 * error    - the listener failed (e.g. permissions); it does not retry
 */
export type ProfileStatus = "idle" | "loading" | "ready" | "missing" | "error";

type ProfileState = {
  uid: string | null;
  profile: WithId<UserProfile> | null;
  status: ProfileStatus;
};

const IDLE_PROFILE: ProfileState = { uid: null, profile: null, status: "idle" };

type AuthContextValue = {
  /** The Firebase user, or null when signed out. May be set while a register/login is still finishing. */
  user: User | null;
  /** What route guards should use: a user exists AND no register/login flow is still running. */
  isSignedIn: boolean;
  /** True only at launch, until the saved session has been restored and checked (or ruled out). */
  initializing: boolean;
  /** The signed-in user's users/{uid} document (live), or null when not available. */
  profile: WithId<UserProfile> | null;
  profileStatus: ProfileStatus;
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

  const isSignedIn = !initializing && user !== null && !flowActive;
  // The profile listener only ever runs for a user the guards consider signed in, i.e. after
  // the register/login flow (or the restored-session check) has finished.
  const activeUid = isSignedIn && user ? user.uid : null;

  const [profileState, setProfileState] = useState<ProfileState>(IDLE_PROFILE);

  useEffect(() => {
    if (!activeUid) {
      setProfileState(IDLE_PROFILE);
      return;
    }

    setProfileState({ uid: activeUid, profile: null, status: "loading" });
    return subscribeToUserProfile(activeUid, (event) => {
      if (event.status === "ready") {
        setProfileState({ uid: activeUid, profile: event.profile, status: "ready" });
      } else if (event.status === "missing") {
        setProfileState({ uid: activeUid, profile: null, status: "missing" });
      } else {
        console.warn("[profile] listener failed", event.error);
        setProfileState({ uid: activeUid, profile: null, status: "error" });
      }
    });
  }, [activeUid]);

  // Whatever is stored is only exposed if it belongs to the CURRENT user, so a previous
  // account's profile can never show up, not even for one render while switching accounts.
  const exposedProfile = useMemo<Pick<AuthContextValue, "profile" | "profileStatus">>(() => {
    if (!activeUid) return { profile: null, profileStatus: "idle" };
    if (profileState.uid !== activeUid) return { profile: null, profileStatus: "loading" };
    return { profile: profileState.profile, profileStatus: profileState.status };
  }, [activeUid, profileState]);

  const signOut = useCallback(() => signOutUser(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isSignedIn,
      initializing,
      profile: exposedProfile.profile,
      profileStatus: exposedProfile.profileStatus,
      signOut,
    }),
    [user, isSignedIn, initializing, exposedProfile, signOut],
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
