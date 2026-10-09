import { router } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../../components/Icon";
import { SavingGoalCard } from "../../components/SavingGoalCard";
import { useSavings } from "../../context/SavingsContext";

export default function SavingsGoalsScreen() {
  const { goals, totalSavings, loading } = useSavings();

  const totalTarget = useMemo(
    () => goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0),
    [goals],
  );

  const overallProgress = useMemo(() => {
    if (totalTarget === 0) return 0;
    return Math.min(100, Math.round((totalSavings / totalTarget) * 100));
  }, [totalSavings, totalTarget]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleCreateNewGoal = () => {
    router.push("/create-goal");
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
          className="h-[38px] w-[38px] items-center justify-center rounded-full"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Icon name="notification" size={22} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 bg-[#f8fafc]"
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }}
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
            Rs {totalSavings.toLocaleString("en-US")}
          </Text>

          <View className="self-start mt-2 bg-white/20 px-3 py-1 rounded-full">
            <Text className="text-white text-[12px] font-bold">
              {goals.length > 0
                ? `🎯 ${overallProgress}% of target reached`
                : "🎯 Start your first goal"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleCreateNewGoal}
          className="h-[52px] rounded-full items-center justify-center flex-row gap-2"
          style={({ pressed }) => ({
            backgroundColor: "#05bf78",
            shadowColor: "#00c46a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 3,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text className="text-white text-[16px] font-bold">
            + Create New Goal
          </Text>
        </Pressable>

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#05bf78" />
            <Text className="text-[13px] text-gray-400 mt-2 font-medium">
              Loading saving goals...
            </Text>
          </View>
        ) : goals.length === 0 ? (
          <View className="bg-white rounded-[22px] p-8 items-center justify-center shadow-sm shadow-black/5">
            <Text className="text-[28px] mb-1.5">🎯</Text>
            <Text className="text-[15px] font-bold text-gray-700">
              No saving goals yet
            </Text>
            <Text className="text-[12.5px] text-gray-400 mt-1 text-center">
              {
                'Tap "+ Create New Goal" above to start saving together with your family!'
              }
            </Text>
          </View>
        ) : (
          <View className="gap-3.5 mt-1">
            {goals.map((goal) => (
              <SavingGoalCard key={goal.id} goal={goal} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
