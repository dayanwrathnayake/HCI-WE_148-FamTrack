import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ExpenseProvider } from "../context/ExpenseContext";
import { SavingsProvider } from "../context/SavingsContext";
import { BillsProvider } from "../context/BillsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ExpenseProvider>
        <SavingsProvider>
          <BillsProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-expense" />
              <Stack.Screen name="expense-history" />
              <Stack.Screen name="manage-group" />
              <Stack.Screen name="create-goal" />
              <Stack.Screen name="recurring-bills" />
              <Stack.Screen name="add-bill" />
            </Stack>
          </BillsProvider>
        </SavingsProvider>
      </ExpenseProvider>
    </SafeAreaProvider>
  );
}
