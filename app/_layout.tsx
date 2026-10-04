import "../global.css";

import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ExpenseProvider } from "../context/ExpenseContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ExpenseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-expense" />
          <Stack.Screen name="expense-history" />
        </Stack>
      </ExpenseProvider>
    </SafeAreaProvider>
  );
}
