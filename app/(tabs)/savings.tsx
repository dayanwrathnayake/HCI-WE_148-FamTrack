import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { SavingGoalCard } from "../../components/SavingGoalCard";
import {
  MOCK_SAVING_GOALS,
  MOCK_SAVINGS_SUMMARY,
  SavingGoal,
} from "../../constants/savings";

export default function SavingsGoalsScreen() {
  const [goals, setGoals] = useState<SavingGoal[]>(MOCK_SAVING_GOALS);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleCreateNewGoal = () => {
    Alert.alert(
      "Create Goal",
      "Goal creation modal / feature will open here.",
      [{ text: "OK" }],
    );
  };

  const handleNotificationPress = () => {
    Alert.alert("Notifications", "You have no new savings notifications.");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          className="h-[34px] w-[34px] rounded-full items-center justify-center bg-[#0e1116]"
        >
          <Icon name="arrowLeft" size={16} />
        </Pressable>

        <Text className="text-[20px] font-bold text-[#111827]">
          Saving Goals
        </Text>

        <Pressable
          onPress={handleNotificationPress}
          hitSlop={8}
          className="h-[38px] w-[38px] items-center justify-center rounded-full active:bg-gray-100"
        >
          <Icon name="notification" size={24} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-[#f8fafc]"
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="rounded-[22px] p-5 justify-between"
          style={{
            backgroundColor: "#05bf78",
            shadowColor: "#00c46a",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <Text className="text-[12px] font-bold tracking-wider text-white/90 uppercase">
            Total Family Savings
          </Text>
          <Text className="text-[28px] font-extrabold text-white mt-1">
            Rs {MOCK_SAVINGS_SUMMARY.totalSavings.toLocaleString("en-US")}
          </Text>

          <View className="self-start mt-2 bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-[12px] font-bold">
              {MOCK_SAVINGS_SUMMARY.monthlyGrowthPercent} this month
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleCreateNewGoal}
          className="h-[52px] rounded-full items-center justify-center flex-row gap-2 active:opacity-90"
          style={{
            backgroundColor: "#05bf78",
            shadowColor: "#00c46a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Text className="text-white text-[16px] font-bold">
            + Create New Goal
          </Text>
        </Pressable>

        <View className="gap-3.5 mt-1">
          {goals.map((goal) => (
            <SavingGoalCard key={goal.id} goal={goal} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
