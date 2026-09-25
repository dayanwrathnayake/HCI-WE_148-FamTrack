import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "./Icon";
import { colors } from "../constants/colors";
import type { IconName } from "../constants/icons";

type TabItem = {
  routeName: string;
  label: string;
  activeIcon: IconName;
  inactiveIcon: IconName;
};

const TAB_ITEMS: TabItem[] = [
  { routeName: "home", label: "Home", activeIcon: "navHome", inactiveIcon: "navHomeInactive" },
  { routeName: "budget", label: "Budget", activeIcon: "navBudget", inactiveIcon: "navBudget" },
  { routeName: "savings", label: "Savings", activeIcon: "navSavings", inactiveIcon: "navSavings" },
  {
    routeName: "settings",
    label: "Settings",
    activeIcon: "navSettings",
    inactiveIcon: "navSettings",
  },
];

type BottomNavBarProps = {
  activeRouteName: string;
  onNavigate: (routeName: string) => void;
  onAddPress?: () => void;
};

export function BottomNavBar({ activeRouteName, onNavigate, onAddPress }: BottomNavBarProps) {
  const leftItems = TAB_ITEMS.slice(0, 2);
  const rightItems = TAB_ITEMS.slice(2);

  return (
    <SafeAreaView edges={["bottom"]} className="bg-white" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
      <View className="h-[64px] flex-row items-center justify-between px-6">
        <View className="flex-row gap-8">
          {leftItems.map((item) => (
            <NavButton
              key={item.routeName}
              item={item}
              active={activeRouteName === item.routeName}
              onPress={() => onNavigate(item.routeName)}
            />
          ))}
        </View>

        <Pressable
          onPress={onAddPress}
          className="h-[46px] w-[46px] items-center justify-center rounded-full"
          style={{
            backgroundColor: "#10b981",
            marginTop: -20,
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Icon name="plus" size={24} />
        </Pressable>

        <View className="flex-row gap-8">
          {rightItems.map((item) => (
            <NavButton
              key={item.routeName}
              item={item}
              active={activeRouteName === item.routeName}
              onPress={() => onNavigate(item.routeName)}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavButton({
  item,
  active,
  onPress,
}: {
  item: TabItem;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center gap-1">
      <Icon name={active ? item.activeIcon : item.inactiveIcon} size={22} />
      <Text
        className="text-[12px] font-bold"
        style={{ color: active ? colors.textDark : "#999999" }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
