import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { getAvatarPalette, getInitials, MemberRecord } from "../utils/members";

type Props = {
  visible: boolean;
  member: MemberRecord | null;
  onClose: () => void;
  onRemove?: (member: MemberRecord) => Promise<void>;
  isAdmin?: boolean;
};

export function EditMemberModal({
  visible,
  member,
  onClose,
  onRemove,
  isAdmin = true,
}: Props) {
  const [removing, setRemoving] = useState(false);
  if (!member) return null;

  const palette = getAvatarPalette(member.id);
  const initials = getInitials(member.displayName);
  const isPending = member.status === "pending";
  const isSelf = member.role === "admin";

  const performRemove = async () => {
    if (!onRemove) return;
    try {
      setRemoving(true);
      await onRemove(member);
      onClose();
    } catch (error: any) {
      if (Platform.OS === "web") {
        window.alert(error.message || "Failed to remove member.");
      } else {
        Alert.alert("Error", error.message || "Failed to remove member.");
      }
    } finally {
      setRemoving(false);
    }
  };

  const handleConfirmRemove = () => {
    const message = `Are you sure you want to ${isPending ? "cancel the invitation for" : "remove"} ${member.displayName}?`;

    // Cross-platform check: Web browser doesn't execute Alert.alert button callbacks
    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        performRemove();
      }
      return;
    }

    Alert.alert(isPending ? "Cancel Invitation" : "Remove Member", message, [
      { text: "No", style: "cancel" },
      {
        text: isPending ? "Cancel Invite" : "Remove",
        style: "destructive",
        onPress: performRemove,
      },
    ]);
  };

  return (
    <Modal
      visible={visible && member !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] p-6 gap-4 shadow-xl">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <MemberInitialsAvatar
                initials={initials}
                backgroundColor={palette.background}
                textColor={palette.text}
                size={44}
              />
              <View>
                <Text className="text-[17px] font-bold text-[#111827]">
                  {member.displayName}
                </Text>
                <Text className="text-[12px] text-[#64748b]">
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
                className={`text-[13px] font-bold capitalize ${isPending ? "text-[#b45309]" : "text-[#05bf78]"}`}
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

          <View className="flex-row gap-3 mt-1">
            {isAdmin && !isSelf && (
              <Pressable
                onPress={handleConfirmRemove}
                disabled={removing}
                className="flex-1 h-[48px] rounded-full items-center justify-center bg-red-50 border border-red-200"
              >
                {removing ? (
                  <ActivityIndicator color="#dc2626" size="small" />
                ) : (
                  <Text className="text-[14px] font-bold text-red-600">
                    {isPending ? "Cancel Invite" : "Remove"}
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={onClose}
              disabled={removing}
              className="flex-1 h-[48px] rounded-full bg-[#05bf78] items-center justify-center"
            >
              <Text className="text-[14px] font-bold text-white">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
