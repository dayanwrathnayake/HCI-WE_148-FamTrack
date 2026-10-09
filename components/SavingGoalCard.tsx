import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { ProgressBar } from "./ProgressBar";
import { useFamily } from "../context/FamilyContext";
import { LiveSavingGoal, useSavings } from "../context/SavingsContext";
import { getAvatarPalette, getInitials } from "../utils/members";

type Props = {
  goal: LiveSavingGoal;
};

export function SavingGoalCard({ goal }: Props) {
  const { members } = useFamily();
  const { deleteGoal } = useSavings();
  const [deleting, setDeleting] = useState(false);

  const target = Math.max(goal.targetAmount, 1);
  const saved = goal.savedAmount || 0;
  const rawRatio = saved / target;
  const progressRatio = Math.min(rawRatio, 1);

  const percentage = (progressRatio * 100).toFixed(
    (progressRatio * 100) % 1 === 0 ? 0 : 1,
  );
  const multiplier = rawRatio.toFixed(1);

  const contributorList = (goal.contributors || []).map((id) => {
    const member = members.find((m) => m.id === id);
    return {
      id,
      name: member?.displayName || "Member",
    };
  });

  const handleDelete = () => {
    const message = `Are you sure you want to delete "${goal.title}"?`;

    const performDelete = async () => {
      try {
        setDeleting(true);
        await deleteGoal(goal.id);
      } catch (error: any) {
        const err = error.message || "Failed to delete saving goal.";
        if (Platform.OS === "web") {
          window.alert(err);
        } else {
          Alert.alert("Error", err);
        }
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Saving Goal", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };

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
            style={{ backgroundColor: goal.iconBg || "#e8f8f0" }}
          >
            <Text className="text-[18px]">{goal.iconEmoji || "🎯"}</Text>
          </View>

          <View className="flex-1">
            <Text
              className="text-[15px] font-bold text-[#111827]"
              numberOfLines={1}
            >
              {goal.title}
            </Text>
            <Text className="text-[12px] font-medium text-[#64748b] mt-0.5">
              Target: RS {goal.targetAmount.toLocaleString("en-US")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center">
            {contributorList.slice(0, 3).map((c, idx) => {
              const palette = getAvatarPalette(c.id);
              const initials = getInitials(c.name);

              return (
                <View
                  key={c.id}
                  style={{
                    marginLeft: idx > 0 ? -8 : 0,
                    zIndex: 10 - idx,
                    borderWidth: 1.5,
                    borderColor: "#ffffff",
                    borderRadius: 13,
                  }}
                >
                  <MemberInitialsAvatar
                    initials={initials}
                    backgroundColor={palette.background}
                    textColor={palette.text}
                    size={24}
                  />
                </View>
              );
            })}
            {contributorList.length > 3 && (
              <View
                className="items-center justify-center bg-gray-100 rounded-full"
                style={{
                  marginLeft: -8,
                  zIndex: 5,
                  width: 24,
                  height: 24,
                  borderWidth: 1.5,
                  borderColor: "#ffffff",
                }}
              >
                <Text className="text-[10px] font-bold text-gray-600">
                  +{contributorList.length - 3}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={8}
            className="w-[28px] h-[28px] rounded-full bg-red-50 border border-red-100 items-center justify-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text className="text-[12px]">🗑️</Text>
            )}
          </Pressable>
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
          RS {saved.toLocaleString("en-US")} saved
        </Text>
        <Text className="text-[12px] font-bold text-[#00c46a]">
          {multiplier}x multiplier
        </Text>
      </View>
    </View>
  );
}
