import { Pressable, Text, View } from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { getAvatarPalette, getInitials, MemberRecord } from "../utils/members";

type Props = {
  member: MemberRecord;
  isLast?: boolean;
  onPress?: () => void;
  spentAmount?: number;
  spentPercentage?: number;
};

export function MemberControlRow({
  member,
  isLast = false,
  onPress,
  spentAmount,
  spentPercentage,
}: Props) {
  const palette = getAvatarPalette(member.id);
  const initials = getInitials(member.displayName);

  const isPending = member.status === "pending";
  const isFullAccess = member.role === "admin" || member.canAddExpenses;

  return (
    <View>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between py-3"
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <MemberInitialsAvatar
            initials={initials}
            backgroundColor={palette.background}
            textColor={palette.text}
            size={42}
          />

          <View className="flex-1">
            <Text
              className="text-[14.5px] font-bold text-[#111827]"
              numberOfLines={1}
            >
              {member.displayName} (
              {member.relationship ||
                (member.role === "admin" ? "Admin" : "Member")}
              )
            </Text>

            <View className="self-start mt-1">
              {isPending ? (
                <View className="bg-[#fef3c7] px-2 py-0.5 rounded-full">
                  <Text className="text-[9px] font-extrabold text-[#b45309] tracking-wider">
                    PENDING INVITE
                  </Text>
                </View>
              ) : isFullAccess ? (
                <View className="bg-[#e8f8f0] px-2 py-0.5 rounded-full">
                  <Text className="text-[9px] font-extrabold text-[#00854b] tracking-wider">
                    FULL ACCESS
                  </Text>
                </View>
              ) : (
                <View className="bg-[#eff6ff] px-2 py-0.5 rounded-full">
                  <Text className="text-[9px] font-extrabold text-[#2563eb] tracking-wider">
                    VIEW ONLY
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-end min-w-[70px]">
            {isPending ? (
              <Text
                className="text-[11px] text-[#94a3b8] font-medium"
                numberOfLines={1}
              >
                {member.inviteEmail || "Invited"}
              </Text>
            ) : spentAmount !== undefined ? (
              <>
                <Text className="text-[9.5px] text-[#94a3b8] font-medium">
                  vs last month
                </Text>
                <Text className="text-[12.5px] font-bold text-[#111827]">
                  Rs {spentAmount.toLocaleString("en-US")}
                </Text>
              </>
            ) : spentPercentage !== undefined ? (
              <View className="items-end gap-1 w-[60px]">
                <Text className="text-[9.5px] text-[#94a3b8] font-medium">
                  Spent {spentPercentage}%
                </Text>
                <View className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <View
                    className="h-full bg-[#05bf78] rounded-full"
                    style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                  />
                </View>
              </View>
            ) : (
              <>
                <Text className="text-[9.5px] text-[#94a3b8] font-medium">
                  Status
                </Text>
                <Text className="text-[12px] font-bold text-[#00854b]">
                  Active
                </Text>
              </>
            )}
          </View>

          <Text className="text-[16px] font-bold text-[#cbd5e1] ml-1">›</Text>
        </View>
      </Pressable>

      {!isLast && <View className="h-[1px] bg-[#f1f5f9]" />}
    </View>
  );
}
