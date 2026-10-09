import { Tabs, router } from "expo-router";
import { BottomNavBar } from "../../components/BottomNavBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <BottomNavBar
          activeRouteName={state.routes[state.index].name}
          onNavigate={(routeName) => navigation.navigate(routeName)}
          onAddPress={() => router.push("/add-expense")}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="budget" />
      <Tabs.Screen name="savings" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
