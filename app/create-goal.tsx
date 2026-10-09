import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { MemberSelector } from "../components/MemberSelector";
import { useFamily } from "../context/FamilyContext";
import { useSavings } from "../context/SavingsContext";
import type { MemberRecord } from "../utils/members";

type GoalCategory = {
  key: string;
  emoji: string;
  label: string;
  bg: string;
};

const GOAL_CATEGORIES: GoalCategory[] = [
  { key: "vault", emoji: "🗄️", label: "Emergency", bg: "#e2e8f0" },
  { key: "vacation", emoji: "🏖️", label: "Vacation", bg: "#bae6fd" },
  { key: "car", emoji: "🚗", label: "Vehicle", bg: "#fef08a" },
  { key: "house", emoji: "🏠", label: "Home", bg: "#bbf7d0" },
  { key: "tech", emoji: "💻", label: "Gadgets", bg: "#e9d5ff" },
  { key: "education", emoji: "🎓", label: "Education", bg: "#fed7aa" },
];

export default function CreateGoalScreen() {
  const { family, activeMembers, currentMember } = useFamily();
  const { addGoal } = useSavings();

  const [goalTitle, setGoalTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(
    null,
  );

  const [customContributors, setCustomContributors] = useState<
    MemberRecord[] | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const contributors = useMemo(() => {
    if (customContributors !== null) return customContributors;
    return currentMember ? [currentMember] : [];
  }, [customContributors, currentMember]);

  const isValid =
    goalTitle.trim().length > 0 &&
    targetAmount.trim().length > 0 &&
    Number(targetAmount.replace(/,/g, "")) > 0 &&
    selectedCategory !== null &&
    contributors.length > 0;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/savings");
    }
  };

  const handleAmountChange = (text: string, setter: (val: string) => void) => {
    const rawNumber = text.replace(/[^0-9]/g, "");
    if (!rawNumber) {
      setter("");
      return;
    }
    setter(Number(rawNumber).toLocaleString("en-US"));
  };

  const handleDateChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    let formatted = "";
    if (digits.length > 0) {
      let day =
        parseInt(digits.slice(0, 2), 10) > 31 ? "31" : digits.slice(0, 2);
      formatted = day;
      if (digits.length >= 3) {
        let month =
          parseInt(digits.slice(2, 4), 10) > 12 ? "12" : digits.slice(2, 4);
        formatted = `${day}/${month}`;
        if (digits.length >= 5) {
          formatted = `${day}/${month}/${digits.slice(4, 8)}`;
        }
      }
    }
    setTargetDate(formatted);
  };

  const handleCreateGoal = async () => {
    if (!isValid || !selectedCategory || !family) return;

    try {
      setSubmitting(true);
      const parsedTarget = Math.max(
        0,
        Math.round(Number(targetAmount.replace(/,/g, ""))),
      );
      const parsedInitial = initialDeposit
        ? Math.max(0, Math.round(Number(initialDeposit.replace(/,/g, ""))))
        : 0;

      await addGoal({
        title: goalTitle.trim(),
        targetAmount: parsedTarget,
        initialDeposit: parsedInitial,
        iconEmoji: selectedCategory.emoji,
        iconBg: selectedCategory.bg,
        contributors: contributors.map((c) => c.id),
        targetDate: targetDate.trim(),
        note: note.trim(),
      });

      handleBack();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to create goal. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
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
          Create Saving Goal
        </Text>

        <View className="w-[34px]" />
      </View>

      <ScrollView
        className="flex-1 bg-[#f8fafc]"
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-[22px] p-5 shadow-sm shadow-black/5 elevation-1 gap-1">
          <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
            Goal Name
          </Text>
          <TextInput
            className="h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 text-[15px] font-medium text-[#111827] outline-none"
            value={goalTitle}
            onChangeText={setGoalTitle}
            placeholder="e.g. Dream House Downpayment"
            placeholderTextColor="#9ca3af"
          />

          <Text className="text-[13px] font-semibold text-[#1f2937] mt-4 mb-2">
            Category & Icon
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GOAL_CATEGORIES.map((cat) => {
              const active = selectedCategory?.key === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat)}
                  className={`flex-row items-center gap-1.5 h-[36px] rounded-full px-3 border ${
                    active
                      ? "bg-[#e8f8f0] border-[#00c46a]"
                      : "bg-[#f8fafc] border-[#e1e5ea]"
                  }`}
                >
                  <Text className="text-[14px]">{cat.emoji}</Text>
                  <Text
                    className={`text-[12.5px] font-semibold ${
                      active ? "text-[#00854b]" : "text-[#64748b]"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
                Target Amount
              </Text>
              <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 gap-2">
                <Text className="text-[13px] font-semibold text-[#6b7280]">
                  RS
                </Text>
                <TextInput
                  className="flex-1 text-[15px] font-medium text-[#1f2937] p-0 outline-none"
                  value={targetAmount}
                  onChangeText={(t) => handleAmountChange(t, setTargetAmount)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
                Target Date
              </Text>
              <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5">
                <TextInput
                  className="flex-1 min-w-0 text-[14px] font-medium text-[#1f2937] p-0 outline-none"
                  value={targetDate}
                  onChangeText={handleDateChange}
                  placeholder="DD/MM/YY"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text className="text-[15px] ml-1 shrink-0">📅</Text>
              </View>
            </View>
          </View>

          <Text className="text-[13px] font-semibold text-[#1f2937] mt-4 mb-1.5">
            Initial Deposit (Optional)
          </Text>
          <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 gap-2">
            <Text className="text-[13px] font-semibold text-[#6b7280]">RS</Text>
            <TextInput
              className="flex-1 text-[15px] font-medium text-[#1f2937] p-0 outline-none"
              value={initialDeposit}
              onChangeText={(t) => handleAmountChange(t, setInitialDeposit)}
              keyboardType="numeric"
              placeholder="0 (e.g. 50,000)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <MemberSelector
            label="Contributors"
            selectedMembers={contributors}
            allMembers={activeMembers}
            onAdd={(m) => setCustomContributors([...contributors, m])}
            onRemove={(id) =>
              setCustomContributors(contributors.filter((x) => x.id !== id))
            }
          />

          <Text className="text-[13px] font-semibold text-[#1f2937] mt-4 mb-1.5">
            Purpose / Note (Optional)
          </Text>
          <TextInput
            className="h-[76px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 pt-3 text-[14px] text-[#111827] outline-none"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. For family year-end holiday..."
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View className="flex-row gap-3 mt-2">
          <Pressable
            className="flex-1 h-[50px] rounded-full items-center justify-center bg-white border border-gray-300 shadow-sm shadow-black/5"
            onPress={handleBack}
            disabled={submitting}
          >
            <Text className="text-[15px] font-semibold text-gray-700">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            className="flex-[1.4] h-[50px] rounded-full items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: isValid && !submitting ? "#05bf78" : "#a0d9c0",
              shadowColor: isValid ? "#00c46a" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isValid ? 0.3 : 0,
              shadowRadius: 8,
              elevation: isValid ? 4 : 0,
            }}
            disabled={!isValid || submitting}
            onPress={handleCreateGoal}
          >
            {submitting && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-[15px] font-bold text-white">
              {submitting ? "Saving..." : "Create Goal"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
