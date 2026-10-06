import { Text, View } from "react-native";
import { SavingGoal } from "../constants/savings";
import { MemberAvatar } from "./MemberAvatar";
import { ProgressBar } from "./ProgressBar";

type Props = {
  goal: SavingGoal;
};

export function SavingGoalCard({ goal }: Props) {
  const progressRatio = Math.min(goal.savedAmount / goal.targetAmount, 1);
  const percentage = (progressRatio * 100).toFixed(
    (progressRatio * 100) % 1 === 0 ? 0 : 1,
  );

  const multiplier = progressRatio.toFixed(1);

  return (
    <View
      className="bg-white rounded-[22px] p-4 shadow-sm shadow-black/5 elevation-1 gap-3.5"
      style={{
        borderWidth: 1,
        borderColor: "#f1f5f9",
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View
            className="w-[42px] h-[42px] rounded-full items-center justify-center"
            style={{ backgroundColor: goal.iconBg }}
          >
            <Text className="text-[18px]">{goal.iconEmoji}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-[15px] font-bold text-[#111827]">
              {goal.title}
            </Text>
            <Text className="text-[12px] font-medium text-[#64748b] mt-0.5">
              Target: RS {goal.targetAmount.toLocaleString("en-US")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          {goal.contributorAvatars.map((avatarSource, idx) => (
            <MemberAvatar
              key={idx}
              source={avatarSource}
              size={24}
              overlap={idx > 0}
            />
          ))}
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <ProgressBar
            progress={progressRatio}
            height={6}
            trackColor="#f1f5f9"
            fillColor="#00c46a"
          />
        </View>
        <Text className="text-[12px] font-bold text-[#00c46a]">
          {percentage}%
        </Text>
      </View>

      <View className="flex-row items-center justify-between pt-1">
        <Text className="text-[12px] font-semibold text-[#64748b]">
          RS {goal.savedAmount.toLocaleString("en-US")} saved
        </Text>
        <Text className="text-[12px] font-bold text-[#00c46a]">
          {multiplier}x multiplier
        </Text>
      </View>
    </View>
  );
}
