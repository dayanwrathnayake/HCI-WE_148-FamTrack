import { Text, View } from "react-native";

import { ProgressBar } from "./ProgressBar";

type BudgetSummaryCardProps = {
  label: string;
  amount: string;
  spentText: string;
  percentText: string;
  progress: number;
  badgeText?: string;
};

export function BudgetSummaryCard({
  label,
  amount,
  spentText,
  percentText,
  progress,
  badgeText,
}: BudgetSummaryCardProps) {
  return (
    <View
      className="w-full gap-3.5 rounded-[24px] p-5"
      style={{
        backgroundColor: "#05bf78",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
      }}
    >
      <View className="gap-1">
        <Text className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
          {label}
        </Text>
        <Text className="text-[26px] font-extrabold text-white">{amount}</Text>
      </View>

      <View className="gap-1.5">
        <ProgressBar
          progress={progress}
          height={8}
          trackColor="rgba(255,255,255,0.25)"
          fillColor="#ffffff"
        />
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
            {spentText}
          </Text>
          <Text className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
            {percentText}
          </Text>
        </View>
      </View>

      {badgeText ? (
        <View
          className="self-start rounded-[8px] px-3 py-1.5"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Text className="text-[12px] font-semibold text-white">{badgeText}</Text>
        </View>
      ) : null}
    </View>
  );
}
