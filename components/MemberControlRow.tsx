import { Image, Pressable, Text, View } from "react-native";
import { GroupMemberControl } from "../constants/group";
import { ProgressBar } from "./ProgressBar";

type Props = {
  member: GroupMemberControl;
  isLast: boolean;
  onPress: () => void;
};

export function MemberControlRow({ member, isLast, onPress }: Props) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between active:opacity-75"
      >
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <Image
            source={member.avatar}
            style={{ width: 42, height: 42, borderRadius: 21 }}
            resizeMode="cover"
          />

          <View className="flex-1">
            <Text className="text-[14px] font-bold text-[#111827]">
              {member.name} ({member.roleDescription})
            </Text>

            <View className="self-start mt-1 bg-[#e8f8f0] px-2 py-0.5 rounded-full">
              <Text className="text-[9px] font-extrabold text-[#00854b] tracking-wider">
                {member.accessType === "FULL ACCESS"
                  ? "FULL ACCESS"
                  : member.limitText}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-end min-w-[70px]">
            {member.accessType === "FULL ACCESS" ? (
              <>
                <Text className="text-[9.5px] text-[#94a3b8] font-medium">
                  vs last month
                </Text>
                <Text className="text-[12.5px] font-bold text-[#111827]">
                  {member.spentAmountText || "Rs 0"}
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[9.5px] text-[#94a3b8] font-medium mb-1">
                  Spent
                </Text>
                <View className="w-[60px]">
                  <ProgressBar
                    progress={member.spentPercentage || 0.5}
                    height={4}
                    trackColor="#f1f5f9"
                    fillColor="#00c46a"
                  />
                </View>
              </>
            )}
          </View>

          <Text className="text-[15px] font-bold text-[#94a3b8]">›</Text>
        </View>
      </Pressable>

      {!isLast && <View className="h-[1px] bg-gray-100 mt-4" />}
    </View>
  );
}
