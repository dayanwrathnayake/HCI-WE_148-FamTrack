import type { Persistence } from "firebase/auth";

// firebase/auth's published typings omit this React Native-only export, even though
// Metro's React Native build of @firebase/auth provides it at runtime.
declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
