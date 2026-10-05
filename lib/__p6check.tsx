// TEMPORARY Phase 6 verification — delete after use.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "../context/AuthContext";
import { auth } from "./firebase";
import { deleteAuthUser, signInWithEmail, signUpWithEmail } from "../services/authService";
import { loginUser } from "../services/loginService";
import { registerUser } from "../services/registrationService";
import { subscribeToUserProfile } from "../services/userService";
import { getFirstName } from "../utils/names";

const L = (...a: unknown[]) => console.log("[P6]", ...a);
const STATE_KEY = "p6:state";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Result = { name: string; ok: boolean };
type State = { phase: number; t: number; results: Result[]; docs: string[]; uids: Record<string, string>; deleted: Record<string, boolean> };

const cur = {
  path: "",
  signedIn: false,
  init: undefined as boolean | undefined,
  uid: null as string | null,
  status: "" as string,
  name: null as string | null,
  signOut: null as null | (() => Promise<void>),
  stale: 0,
  events: [] as string[],
  statusLog: [] as string[],
};

export function P6Probe() {
  const { user, isSignedIn, initializing, profile, profileStatus, signOut } = useAuth();
  const pathname = usePathname();
  cur.signedIn = isSignedIn;
  cur.init = initializing;
  cur.path = pathname;
  cur.uid = user?.uid ?? null;
  cur.status = profileStatus;
  cur.name = profile?.name ?? null;
  cur.signOut = signOut;
  // A profile must only ever be exposed for the user that is currently signed in.
  if (profile && (!user || !isSignedIn || profile.id !== user.uid)) cur.stale += 1;

  useEffect(() => {
    if (cur.events[cur.events.length - 1] !== pathname) cur.events.push(pathname);
  }, [pathname]);

  useEffect(() => {
    const entry = `${user ? user.uid.slice(0, 6) : "none"}:${profileStatus}`;
    if (cur.statusLog[cur.statusLog.length - 1] !== entry) cur.statusLog.push(entry);
    L("ev", `signedIn=${isSignedIn} user=${user ? user.uid.slice(0, 6) : "none"} status=${profileStatus} name=${JSON.stringify(profile?.name ?? null)} path=${pathname}`);
  }, [isSignedIn, user, profileStatus, profile, pathname]);

  return null;
}

async function waitFor(cond: () => boolean, ms = 10000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (cond()) return true;
    await sleep(100);
  }
  return cond();
}

async function run() {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  const state: State = raw
    ? JSON.parse(raw)
    : { phase: 1, t: Date.now(), results: [], docs: [], uids: {}, deleted: {} };
  const save = () => AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  const record = (name: string, ok: boolean, detail = "") => {
    state.results.push({ name, ok });
    L(ok ? "PASS" : "FAIL", "|", name, detail ? `| ${detail}` : "");
  };
  const shot = async (name: string) => {
    await sleep(1500);
    L("SHOT", name);
    await sleep(1800);
  };
  const PW = `Tmp-${state.t}-Aa1!`;
  const email = (k: string) => `bootcheck-${k}-${state.t}@example.com`;

  // Registers `name` under key k, waits for Home, and checks profile/greeting state.
  async function registerAndCheck(k: string, name: string, expectFirst: string, label: string) {
    const logStart = cur.statusLog.length;
    const reg = await registerUser({ name, email: email(k), password: PW });
    state.uids[k] = reg.uid;
    state.docs.push(`users/${reg.uid}`, `families/${reg.familyId}`, `families/${reg.familyId}/members/${reg.uid}`);
    await waitFor(() => cur.signedIn && cur.path === "/home" && cur.status === "ready", 8000);
    const seq = cur.statusLog.slice(logStart);
    const sawMissing = seq.some((s) => s.endsWith(":missing") || s.endsWith(":error"));
    record(`${label}: profile ready on Home for the new account, first name "${expectFirst}"`,
      cur.path === "/home" && cur.status === "ready" && getFirstName(cur.name) === expectFirst && cur.uid === reg.uid,
      `storedName=${JSON.stringify(cur.name)} status=${cur.status} seq=${JSON.stringify(seq)}`);
    record(`${label}: no transient "missing"/"error" while loading (no wrong greeting flash)`, !sawMissing);
    return reg;
  }

  async function signOutAndCheck(label: string) {
    await cur.signOut!();
    await sleep(300);
    record(`${label}: sign-out clears profile immediately (idle, null)`,
      cur.status === "idle" && cur.name === null && cur.uid === null && !cur.signedIn,
      `status=${cur.status} name=${cur.name}`);
    await waitFor(() => cur.path === "/login" || cur.path === "/onboarding/welcome", 6000);
  }

  L("launch; phase", state.phase, "run id", state.t);
  try {
    await waitFor(() => cur.init === false, 20000);
    await sleep(1500);

    // ============================================================ phase 1
    if (state.phase === 1) {
      if (auth.currentUser && cur.signOut) {
        await cur.signOut();
        await sleep(500);
      }
      router.push("/register");
      await waitFor(() => cur.path === "/register");

      // 1: register A -> real first name; also the greeting screenshot
      await registerAndCheck("a", "Phase Six", "Phase", "1 register A (two-word name)");
      await shot("1_home_phase");

      // 9: sign-out clears the profile
      await signOutAndCheck("9 after A");

      // 2: login A -> real first name
      const logStart = cur.statusLog.length;
      await loginUser(email("a"), PW);
      await waitFor(() => cur.signedIn && cur.path === "/home" && cur.status === "ready", 8000);
      const seq = cur.statusLog.slice(logStart);
      record('2 login A: profile ready on Home, first name "Phase"',
        cur.path === "/home" && cur.status === "ready" && getFirstName(cur.name) === "Phase",
        `name=${JSON.stringify(cur.name)} seq=${JSON.stringify(seq)}`);
      await shot("2_home_after_login");

      // 4 + 5: switch accounts -> never the previous name; single-word name
      await signOutAndCheck("9b after A (2nd)");
      const staleBefore = cur.stale;
      await registerAndCheck("b", "Bob", "Bob", "5 register B (single-word name)");
      record('4 account switch A -> B: Home shows B\'s name, never A\'s (no stale profile in any render)',
        cur.name === "Bob" && cur.stale === staleBefore && cur.stale === 0, `stale=${cur.stale}`);
      await shot("5_home_bob");

      // 6: extra whitespace
      await signOutAndCheck("9c after B");
      await registerAndCheck("c", "  Mary   Ann  ", "Mary", "6 register C (leading/inner/trailing spaces)");
      await shot("6_home_mary");

      // 7: very long first name
      await signOutAndCheck("9d after C");
      const longName = "Supercalifragilisticexpialidocious" + "x".repeat(60) + " Tail";
      await registerAndCheck("d", longName, longName.split(" ")[0], "7 register D (94-char first name)");
      await shot("7_home_longname");

      // 12: service-level error event (reading ANOTHER user's profile is denied by the rules)
      const errEvent = await new Promise<string>((resolve) => {
        const unsub = subscribeToUserProfile(state.uids["a"], (e) => {
          resolve(e.status === "error" ? `error:${(e.error as any)?.code}` : e.status);
          unsub();
        });
        setTimeout(() => resolve("timeout"), 6000);
      });
      record("12 listener error path: reading another user's profile reports an error event", errEvent === "error:permission-denied", errEvent);

      // leave A signed in for the cold-relaunch test
      await signOutAndCheck("9e after D");
      await loginUser(email("a"), PW);
      await waitFor(() => cur.signedIn && cur.path === "/home" && cur.status === "ready", 8000);
      state.phase = 2;
    }

    // ============================================================ phase 2
    else if (state.phase === 2) {
      // cold relaunch with a saved session
      const firstHome = cur.statusLog.filter((s) => s.endsWith(":missing") || s.endsWith(":error"));
      record("3 cold relaunch: Home shows the saved user's first name",
        cur.signedIn && cur.path === "/home" && cur.status === "ready" && getFirstName(cur.name) === "Phase" &&
          firstHome.length === 0 && cur.stale === 0,
        `name=${JSON.stringify(cur.name)} seq=${JSON.stringify(cur.statusLog)} paths=${JSON.stringify(cur.events)}`);
      await shot("3_cold_home");

      // 8: profile reported missing during an ACTIVE session (not a restored one)
      await signOutAndCheck("9f after cold A");
      await signUpWithEmail(email("o"), PW); // Auth user with no users/{uid}; NOT inside the lock
      const gotMissing = await waitFor(() => cur.status === "missing", 10000);
      await sleep(1000);
      record('8 active session whose profile is reported missing: status "missing", Home falls back to generic greeting, no crash',
        gotMissing && cur.path === "/home" && cur.name === null && cur.stale === 0,
        `status=${cur.status} path=${cur.path} seq=${JSON.stringify(cur.statusLog.slice(-4))}`);
      await shot("8_home_missing");
      state.phase = 3;
    }

    // ============================================================ phase 3
    else if (state.phase === 3) {
      // Phase 5 regression: a RESTORED orphan session must still be signed out at launch.
      record("8b Phase 5 intact: restored orphan session was signed out at cold start and never reached Home",
        auth.currentUser === null && !cur.signedIn && cur.path === "/login" && !cur.events.includes("/home"),
        `currentUser=${auth.currentUser?.uid ?? "null"} path=${cur.path} paths=${JSON.stringify(cur.events)}`);
      await shot("8b_orphan_relaunch_login");

      // 10: getFirstName unit cases
      const cases: [string | null | undefined, string | null][] = [
        ["Shakna Rizath", "Shakna"], ["  Mary   Ann  ", "Mary"], ["Bob", "Bob"], ["", null], ["   ", null],
        [null, null], [undefined, null], [" Zed Q", "Zed"], ["😀 Smile", "😀"], ["Kamal\tPerera", "Kamal"],
      ];
      const bad = cases.filter(([i, o]) => getFirstName(i) !== o);
      record("10 getFirstName unit cases (names, spaces, empty, null, NBSP, emoji, tab)", bad.length === 0, JSON.stringify(bad));

      // cleanup of Auth users
      for (const k of ["o", "a", "b", "c", "d"]) {
        try {
          await signInWithEmail(email(k), PW);
          await deleteAuthUser(auth.currentUser!);
          state.deleted[k] = true;
        } catch (e: any) {
          L("CLEANUP failed for", email(k), e?.code);
        }
      }
      await sleep(800);
      const failed = state.results.filter((r) => !r.ok);
      L("AUTH USERS:", JSON.stringify(["a", "b", "c", "d", "o"].map((k) => ({ email: email(k), deleted: !!state.deleted[k] }))));
      L("FIRESTORE DOCS CREATED (manual cleanup):", JSON.stringify(state.docs));
      L("SUMMARY", `${state.results.length - failed.length}/${state.results.length} passed`,
        failed.length ? `FAILED: ${failed.map((f) => f.name).join(" ; ")}` : "all passed");
      state.phase = 4;
    }
  } catch (e: any) {
    L("FATAL", e?.code, e?.message);
    state.results.push({ name: "FATAL in phase " + state.phase, ok: false });
  }
  await save();
  L("PHASEDONE", state.phase - 1, `(next phase ${state.phase})`);
}

run();
