import "../global.css";

import { Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "../context/AuthContext";
import { BillsProvider } from "../context/BillsContext";
import { ExpenseProvider } from "../context/ExpenseContext";
import { FamilyProvider } from "../context/FamilyContext";
import { SavingsProvider } from "../context/SavingsContext";
import { AccountProvider } from "../context/AccountContext";
import { IncomeProvider } from "../context/IncomeContext";
import { NotificationProvider } from "../context/NotificationContext";
import { markOnboardingCompleted } from "../services/onboardingService";

function RootNavigator() {
  const { isSignedIn, initializing } = useAuth();
  const firstSegment: string | undefined = useSegments()[0];

  // Reaching Login or Register means onboarding is finished (or was skipped).
  useEffect(() => {
    if (firstSegment === "login" || firstSegment === "register") {
      void markOnboardingCompleted();
    }
  }, [firstSegment]);

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public screens: only reachable while signed out. */}
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/welcome" />
          <Stack.Screen name="onboarding/track-shared-expenses" />
          <Stack.Screen name="onboarding/plan-budget" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>

        {/*
          Authenticated screens. IMPORTANT: every new screen that needs a signed-in user
          (new files in app/ outside the onboarding/login/register set above) must be
          added to THIS group, or it will be reachable while signed out.
        */}
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="category-budget" />
          <Stack.Screen name="edit-family-budget" />
          <Stack.Screen name="shared-expenses" />
          <Stack.Screen name="add-expense" />
          <Stack.Screen name="expense-history" />
          <Stack.Screen name="manage-group" />
          <Stack.Screen name="create-goal" />
          <Stack.Screen name="recurring-bills" />
          <Stack.Screen name="add-bill" />
          <Stack.Screen name="my-account" />
          <Stack.Screen name="income" />
          <Stack.Screen name="add-income" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="notifications" />
        </Stack.Protected>
      </Stack>

      {/* Covers the first frames while the saved session is restored, so nothing flashes. */}
      {initializing ? <View style={styles.loading} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FamilyProvider>
          <NotificationProvider>
          <AccountProvider>
          <IncomeProvider>
          <ExpenseProvider>
            <SavingsProvider>
              <BillsProvider>
                <RootNavigator />
              </BillsProvider>
            </SavingsProvider>
          </ExpenseProvider>
          </IncomeProvider>
          </AccountProvider>
          </NotificationProvider>
        </FamilyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#ffffff",
  },
});
