import { Alert, Modal, Pressable, Text, View } from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { getAvatarPalette, getInitials, MemberRecord } from "../utils/members";

type Props = {
  visible: boolean;
  member: MemberRecord | null;
  onClose: () => void;
  onRemove?: (id: string) => void;
};

export function EditMemberModal({ visible, member, onClose, onRemove }: Props) {
  if (!member) return null;

  const palette = getAvatarPalette(member.id);
  const initials = getInitials(member.displayName);
  const isPending = member.status === "pending";
  const isAdmin = member.role === "admin";

  const handleRemove = () => {
    if (!onRemove) return;
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.displayName} from this family group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            onRemove(member.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] p-6 gap-5 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 mr-2">
              <MemberInitialsAvatar
                initials={initials}
                backgroundColor={palette.background}
                textColor={palette.text}
                size={44}
              />
              <View className="flex-1">
                <Text
                  className="text-[17px] font-bold text-[#111827]"
                  numberOfLines={1}
                >
                  {member.displayName}
                </Text>
                <Text className="text-[12px] text-[#64748b]" numberOfLines={1}>
                  {member.inviteEmail || "Family Member"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              className="h-[30px] w-[30px] rounded-full bg-gray-100 items-center justify-center"
              hitSlop={8}
            >
              <Text className="text-gray-500 font-bold text-[14px]">✕</Text>
            </Pressable>
          </View>

          <View className="bg-[#f8fafc] rounded-[16px] p-4 gap-2.5 border border-[#e2e8f0]">
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-[#64748b]">Role:</Text>
              <Text className="text-[13px] font-bold text-[#111827] capitalize">
                {member.role}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-[#64748b]">Relationship:</Text>
              <Text className="text-[13px] font-bold text-[#111827]">
                {member.relationship || "Other"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-[#64748b]">Status:</Text>
              <Text
                className={`text-[13px] font-bold capitalize ${
                  isPending ? "text-[#d97706]" : "text-[#05bf78]"
                }`}
              >
                {isPending ? "Pending Invitation" : "Active Member"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-[13px] text-[#64748b]">Add Expenses:</Text>
              <Text className="text-[13px] font-bold text-[#111827]">
                {member.canAddExpenses ? "Allowed" : "Restricted"}
              </Text>
            </View>
          </View>

          <View className="gap-2.5 mt-1">
            <Pressable
              onPress={onClose}
              className="h-[48px] rounded-full bg-[#05bf78] items-center justify-center"
            >
              <Text className="text-[14px] font-bold text-white">Done</Text>
            </Pressable>

            {onRemove && !isAdmin && (
              <Pressable
                onPress={handleRemove}
                className="h-[44px] rounded-full bg-red-50 items-center justify-center border border-red-200"
              >
                <Text className="text-[13.5px] font-bold text-red-600">
                  {isPending ? "Cancel Invitation" : "Remove From Family"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
