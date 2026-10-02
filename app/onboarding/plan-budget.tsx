import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BudgetCategoryRow } from "../../components/BudgetCategoryRow";
import { BudgetSummaryCard } from "../../components/BudgetSummaryCard";
import { OnboardingDots } from "../../components/OnboardingDots";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors } from "../../constants/colors";

const categories = [
  { name: "Food", spentText: "Rs 42,300", totalText: "Rs 60,000", progress: 42300 / 60000, fillColor: "#10b981" },
  { name: "Transport", spentText: "Rs 18,700", totalText: "Rs 20,000", progress: 18700 / 20000, fillColor: "#ef4444" },
  { name: "Utilities", spentText: "Rs 15,200", totalText: "Rs 40,000", progress: 15200 / 40000, fillColor: "#10b981" },
];

export default function OnboardingPlanBudget() {
  const handleGetStarted = () => router.push("/register");

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 pt-8 pb-4">
        <View>
          <Text className="text-[24px] font-bold" style={{ color: colors.textDark }}>
            Plan Your Budget
          </Text>
          <Text className="mt-3 text-[15px] leading-[22px]" style={{ color: colors.textMuted }}>
            Set goals, track spending and stay on top of your family&apos;s finances together.
          </Text>

          <View className="mt-9 gap-4">
            <BudgetSummaryCard
              label="Monthly Budget"
              amount="Rs 150,000"
              spentText="Spent: Rs 105,000"
              percentText="70%"
              progress={0.7}
              badgeText="✓ You're on track!"
            />

            <View className="gap-3.5 pt-2">
              {categories.map((category) => (
                <BudgetCategoryRow key={category.name} {...category} />
              ))}
            </View>
          </View>
        </View>

        <View className="flex-1" />

        <OnboardingDots total={3} activeIndex={2} />

        <PrimaryButton label="Get Started" onPress={handleGetStarted} />
      </View>
    </SafeAreaView>
  );
}
