import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { ProgressBar } from "../../components/ProgressBar";
import { colors } from "../../constants/colors";
import type { IconName } from "../../constants/icons";

const TOTAL_BALANCE = "Rs 60,000.00";
const BUDGET_LEFT = "Rs 35,500.00";
const BUDGET_SPENT_TEXT = "-Rs 24,500.00 spent this month";
const BUDGET_PROGRESS = 24500 / 60000;

const categoryPills: {
  icon: IconName;
  background: string;
  name: string;
  spentText: string;
  spentColor: string;
}[] = [
  {
    icon: "categoryEntertainment",
    background: "rgba(102,255,163,0.1)",
    name: "Entertainment",
    spentText: "Rs 3,430 spent",
    spentColor: "#1DA463",
  },
  {
    icon: "categoryFood",
    background: "rgba(255,148,102,0.1)",
    name: "Food",
    spentText: "Rs 430 spent",
    spentColor: "#FF9466",
  },
  {
    icon: "categoryBlue",
    background: "rgba(61,185,255,0.1)",
    name: "Entertainment",
    spentText: "Rs 3,430 spent",
    spentColor: "#3DB9FF",
  },
];

export default function HomeScreen() {
  const [balanceHidden, setBalanceHidden] = useState(false);

  // TODO: wire up once the Family Budget screen exists.
  const handleFamilyBudgetPress = () => {};
  // TODO: Bills & Reminders belongs to another team member's module.
  const handleBillsPress = () => {};
  const handleAllBudgetsPress = () => router.push("/(tabs)/budget");
  const handleSpendPress = () => {};
  const handleIncomePress = () => {};
  const handleNotificationPress = () => {};

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-[24px] font-extrabold" style={{ color: "#222222" }}>
              Hello <Text style={{ color: "#1dcd9f" }}>Kamal</Text> 👋
            </Text>
            <Text className="mt-1 text-[15px] font-bold" style={{ color: "#999999" }}>
              Ready to track your money..!
            </Text>
          </View>
          <Pressable onPress={handleNotificationPress} hitSlop={8}>
            <Icon name="notification" size={30} />
          </Pressable>
        </View>

        <View
          className="mt-4 gap-4 rounded-[16px] p-3"
          style={{ backgroundColor: "#F6F6F6", borderWidth: 1, borderColor: colors.border }}
        >
          {/* Balance */}
          <View
            className="flex-row items-center gap-3 rounded-[16px] bg-white p-4"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <View className="h-[52px] w-[52px] items-center justify-center">
              <Icon name="moneyBag" width={40} height={46} />
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-[14px] font-bold" style={{ color: "#999999" }}>
                Total Balance
              </Text>
              <Text className="text-[22px] font-extrabold" style={{ color: "#222222" }}>
                {balanceHidden ? "Rs ••,•••.••" : TOTAL_BALANCE}
              </Text>
            </View>
            <Pressable
              onPress={() => setBalanceHidden((h) => !h)}
              className="flex-row items-center gap-2 rounded-full px-3 py-2"
              style={{ backgroundColor: "#efefef" }}
            >
              <Icon name="eye" size={18} />
              <Text className="text-[14px] font-bold text-black">
                {balanceHidden ? "Show" : "Hide"}
              </Text>
            </Pressable>
          </View>

          {/* Spend / Income */}
          <View className="flex-row gap-4">
            <Pressable
              onPress={handleSpendPress}
              className="h-[73px] flex-1 flex-row items-center justify-center gap-3 rounded-[12px]"
              style={{ backgroundColor: "#222222" }}
            >
              <Icon name="spend" width={28} height={28} />
              <Text className="text-[16px] font-bold text-white">Spend</Text>
            </Pressable>
            <Pressable
              onPress={handleIncomePress}
              className="h-[73px] flex-1 flex-row items-center justify-center gap-3 rounded-[12px]"
              style={{ backgroundColor: "#1dcd9f" }}
            >
              <Icon name="income" width={26} height={28} />
              <Text className="text-[16px] font-bold text-white">Income</Text>
            </Pressable>
          </View>

          {/* Budget */}
          <View className="gap-4 rounded-[16px] bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[20px] font-semibold" style={{ color: "#222222" }}>
                Budget
              </Text>
              <Pressable
                onPress={handleAllBudgetsPress}
                className="rounded-full px-3 py-2"
                style={{ backgroundColor: "rgba(106,102,255,0.1)" }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: "#6a66ff" }}>
                  All Budgets
                </Text>
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text style={{ color: "#222222" }}>
                  <Text className="text-[28px] font-semibold">{BUDGET_LEFT} </Text>
                  <Text className="text-[14px] font-semibold">left</Text>
                </Text>
                <Text className="text-[12px]" style={{ color: "rgba(56,56,56,0.5)" }}>
                  {BUDGET_SPENT_TEXT}
                </Text>
              </View>
              <ProgressBar
                progress={BUDGET_PROGRESS}
                height={6}
                trackColor="#EFEFFF"
                fillColor="#6a66ff"
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2.5">
                {categoryPills.map((pill, index) => (
                  <View
                    key={index}
                    className="flex-row items-center gap-2.5 rounded-[35px] px-4 py-2.5"
                    style={{ backgroundColor: pill.background }}
                  >
                    <Icon name={pill.icon} size={24} />
                    <View>
                      <Text className="text-[12px] font-medium text-black">{pill.name}</Text>
                      <Text
                        className="text-[12px] font-semibold"
                        style={{ color: pill.spentColor }}
                      >
                        {pill.spentText}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Shortcuts */}
        <View className="mt-4 flex-row gap-3">
          <Pressable
            onPress={handleFamilyBudgetPress}
            className="h-[89px] flex-1 justify-end gap-2 rounded-[18px] bg-white p-3.5"
            style={{
              shadowColor: "#0e1116",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <View
              className="h-[34px] w-[34px] items-center justify-center rounded-[11px]"
              style={{ backgroundColor: "#e8f8f0" }}
            >
              <Text className="text-[16px]">👨‍👩‍👧</Text>
            </View>
            <Text className="text-[11.5px] font-semibold" style={{ color: "#0e1116" }}>
              Family Budget
            </Text>
          </Pressable>

          <Pressable
            onPress={handleBillsPress}
            className="h-[89px] flex-1 justify-end gap-2 rounded-[18px] bg-white p-3.5"
            style={{
              shadowColor: "#0e1116",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View
              className="h-[34px] w-[34px] items-center justify-center rounded-[11px]"
              style={{ backgroundColor: "#fff1e6" }}
            >
              <Text className="text-[16px]">🔔</Text>
            </View>
            <Text className="text-[11.5px] font-semibold" style={{ color: "#0e1116" }}>
              Bills & Reminders
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
