import { Text, View } from "react-native";

import { ProgressBar } from "./ProgressBar";
import { colors } from "../constants/colors";

type BudgetCategoryRowProps = {
  name: string;
  spentText: string;
  totalText: string;
  progress: number;
  fillColor: string;
};

export function BudgetCategoryRow({
  name,
  spentText,
  totalText,
  progress,
  fillColor,
}: BudgetCategoryRowProps) {
  return (
    <View className="w-full gap-2">
      <View className="flex-row items-start justify-between">
        <Text className="text-[15px] font-medium" style={{ color: colors.textDark }}>
          {name}
        </Text>
        <Text className="text-[12px]">
          <Text className="font-medium" style={{ color: colors.textMuted }}>
            {spentText}{" "}
          </Text>
          <Text className="font-medium" style={{ color: colors.textFaint }}>
            of {totalText}
          </Text>
        </Text>
      </View>
      <ProgressBar progress={progress} height={6} trackColor={colors.border} fillColor={fillColor} />
    </View>
  );
}
