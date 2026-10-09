import AsyncStorage from "@react-native-async-storage/async-storage";

export const ONBOARDING_COMPLETED_KEY = "famtrack:onboardingCompleted";

// Deliberately has no "clear" function: logging out must not bring onboarding back.

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  } catch {
    // Not being able to remember this only means onboarding may be shown again.
  }
}
