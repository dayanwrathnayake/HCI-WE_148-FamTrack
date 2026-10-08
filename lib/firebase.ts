import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, connectAuthEmulator, getAuth, getReactNativePersistence, initializeAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryEagerGarbageCollector,
  memoryLocalCache,
  connectFirestoreEmulator,
} from "firebase/firestore";

// Expo only inlines EXPO_PUBLIC_* variables that are read as `process.env.NAME`,
// so each one has to be accessed explicitly (no destructuring or dynamic keys).
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const useEmulators = __DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1";
if (useEmulators) firebaseConfig.projectId = "demo-famtrack";

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase config: ${missingKeys.join(", ")}. ` +
      "Copy .env.example to .env.local, fill in the values, and restart Expo with `npx expo start -c`.",
  );
}

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if called twice for the same app (e.g. on Fast Refresh),
// so fall back to the existing instance in that case.
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: Platform.OS === "web" ? browserLocalPersistence : getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
// Eager garbage collection: as soon as nothing is listening to a document or query, its cached
// data AND its listen state (resume token) are dropped. With the default cache, one account's
// listen on a family was resumed later by a DIFFERENT account on the same device, and the
// server refused it because it judged the resume point from before that account's profile
// existed. It also stops one account's cached data lingering for the next account.
function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: memoryLocalCache({ garbageCollector: memoryEagerGarbageCollector() }),
    });
  } catch {
    // Already initialised (e.g. Fast Refresh): reuse the existing instance.
    return getFirestore(app);
  }
}

export const db = createDb();
export const storage = getStorage(app, useEmulators ? "gs://demo-famtrack.appspot.com" : undefined);
export const functions = getFunctions(app);
// Persist this marker across Fast Refresh; emulator connectors must run once, before requests.
const emulatorState = globalThis as typeof globalThis & { famtrackEmulatorsConnected?: boolean };
if (useEmulators && !emulatorState.famtrackEmulatorsConnected) {
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, emulatorHost, 8080);
  connectStorageEmulator(storage, emulatorHost, 9199);
  connectFunctionsEmulator(functions, emulatorHost, 15001);
  emulatorState.famtrackEmulatorsConnected = true;
}
