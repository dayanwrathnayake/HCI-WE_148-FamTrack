import { router } from "expo-router";

import { BottomNavBar } from "./BottomNavBar";

const ROUTE_PATHS: Record<
  string,
  "/(tabs)/home" | "/(tabs)/budget" | "/(tabs)/savings" | "/(tabs)/settings"
> = {
  home: "/(tabs)/home",
  budget: "/(tabs)/budget",
  savings: "/(tabs)/savings",
  settings: "/(tabs)/settings",
};

type AppBottomNavProps = {
  activeRouteName: string;
};

// For screens pushed outside the (tabs) group (e.g. Category Budget, Edit Family
// Budget) that still need to show the persistent bottom nav with a forced-active tab.
export function AppBottomNav({ activeRouteName }: AppBottomNavProps) {
  return (
    <BottomNavBar
      activeRouteName={activeRouteName}
      onNavigate={(routeName) => {
        const path = ROUTE_PATHS[routeName];
        if (path) router.replace(path);
      }}
      onAddPress={() => router.push("/add-expense")}
    />
  );
}

