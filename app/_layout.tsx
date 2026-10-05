import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ExpenseProvider } from "../context/ExpenseContext";
import { SavingsProvider } from "../context/SavingsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ExpenseProvider>
        <SavingsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-expense" />
            <Stack.Screen name="expense-history" />
            <Stack.Screen name="manage-group" />
            <Stack.Screen name="create-goal" />
          </Stack>
        </SavingsProvider>
      </ExpenseProvider>
    </SafeAreaProvider>
  );
}
