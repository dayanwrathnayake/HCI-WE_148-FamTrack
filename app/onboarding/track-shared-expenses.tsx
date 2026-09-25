import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ExpenseRow } from "../../components/ExpenseRow";
import { OnboardingDots } from "../../components/OnboardingDots";
import { colors } from "../../constants/colors";

const avatar1 = require("../../assets/onboarding/avatar1.png");
const avatar2 = require("../../assets/onboarding/avatar2.png");
const avatar3 = require("../../assets/onboarding/avatar3.png");
const avatar4 = require("../../assets/onboarding/avatar4.png");
const avatar5 = require("../../assets/onboarding/avatar5.png");
const avatar6 = require("../../assets/onboarding/avatar6.png");
const avatar7 = require("../../assets/onboarding/avatar7.png");

const expenses = [
  {
    icon: "basket" as const,
    iconBackground: "#e0f2fe",
    name: "Groceries",
    amount: "Rs 8,450",
    avatars: [avatar1, avatar2],
  },
  {
    icon: "plug" as const,
    iconBackground: "#fef3c7",
    name: "Utilities",
    amount: "Rs 12,340",
    avatars: [avatar3, avatar4],
  },
  {
    icon: "car" as const,
    iconBackground: "#d1fae5",
    name: "Transport",
    amount: "Rs 7,500",
    avatars: [avatar5],
  },
  {
    icon: "utensils" as const,
    iconBackground: "#fce7f3",
    name: "Food",
    amount: "Rs 5,200",
    avatars: [avatar6, avatar7],
  },
];

export default function OnboardingTrackSharedExpenses() {
  const handleSkip = () => router.push("/login");
  const handleNext = () => router.push("/onboarding/plan-budget");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 justify-between px-6 pt-8 pb-4">
        <View>
          <Text className="text-[24px] font-bold" style={{ color: colors.textDark }}>
            Track Shared Expenses
          </Text>
          <Text className="mt-3 text-[15px] leading-[22px]" style={{ color: colors.textMuted }}>
            Keep a clear record of every expense from groceries to bills. Everyone stays in the
            loop.
          </Text>

          <View
            className="mt-9 w-full rounded-[24px] bg-white p-4"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 3,
            }}
          >
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[15px] font-semibold" style={{ color: colors.textDark }}>
                Active Shared List
              </Text>
              <Text className="text-[12px] font-medium" style={{ color: "#10b981" }}>
                Live
              </Text>
            </View>
            {expenses.map((expense, index) => (
              <ExpenseRow
                key={expense.name}
                icon={expense.icon}
                iconBackground={expense.iconBackground}
                name={expense.name}
                amount={expense.amount}
                avatars={expense.avatars}
                showDivider={index < expenses.length - 1}
              />
            ))}
          </View>

          <View className="mt-9">
            <OnboardingDots total={3} activeIndex={1} />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Text className="text-[15px] font-semibold" style={{ color: colors.textMuted }}>
              Skip
            </Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            className="flex-row items-center rounded-[22px] px-5 py-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-[15px] font-semibold text-white">Next →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
