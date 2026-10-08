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
import { useFamily } from "../context/FamilyContext";
import { LiveRecurringBill, useBills } from "../context/BillsContext";
import { getAvatarPalette, getInitials } from "../utils/members";

type Props = {
  bill: LiveRecurringBill;
  isLast?: boolean;
};

export function BillItemRow({ bill, isLast = false }: Props) {
  const { members } = useFamily();
  const { deleteBill, markAsPaid } = useBills();
  const [deleting, setDeleting] = useState(false);

  const assignedMember = bill.assignedMemberId
    ? members.find((m) => m.id === bill.assignedMemberId)
    : null;

  const assignedInitials = assignedMember
    ? getInitials(assignedMember.displayName)
    : "";
  const assignedPalette = assignedMember
    ? getAvatarPalette(assignedMember.id)
    : null;

  const handleDelete = () => {
    const message = `Are you sure you want to delete "${bill.title}" (Rs ${bill.amount.toLocaleString("en-US")})?`;

    const performDelete = async () => {
      try {
        setDeleting(true);
        await deleteBill(bill.id);
      } catch (error: any) {
        const err = error.message || "Failed to delete bill.";
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

    Alert.alert("Delete Bill", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };

  const handleTogglePaid = async () => {
    if (bill.status === "PAID") return;
    try {
      await markAsPaid(bill.id, "Paid by member");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update bill.");
    }
  };

  return (
    <View>
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-3 flex-1 mr-2">
          <View
            className="w-[42px] h-[42px] rounded-full items-center justify-center"
            style={{ backgroundColor: bill.iconBg || "#e0f2fe" }}
          >
            <Text className="text-[18px]">{bill.iconEmoji || "📄"}</Text>
          </View>

          <View className="flex-1">
            <Text
              className="text-[14.5px] font-bold text-[#111827]"
              numberOfLines={1}
            >
              {bill.title}
            </Text>

            {bill.paidByText ? (
              <Text className="text-[11px] text-[#64748b] mt-0.5">
                {bill.paidByText}
              </Text>
            ) : (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Text className="text-[11.5px] text-[#64748b]">
                  {bill.isAutoPay ? "Auto-debit" : "Due"} • {bill.dueDate}
                </Text>
                {assignedMember && assignedPalette && (
                  <MemberInitialsAvatar
                    initials={assignedInitials}
                    backgroundColor={assignedPalette.background}
                    textColor={assignedPalette.text}
                    size={18}
                  />
                )}
              </View>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="items-end gap-1">
            <Text className="text-[14px] font-bold text-[#111827]">
              Rs {bill.amount.toLocaleString("en-US")}
            </Text>

            {bill.status === "UNPAID" && (
              <Pressable
                onPress={handleTogglePaid}
                className="bg-[#fef3c7] px-2 py-0.5 rounded-[6px] active:bg-[#fde68a]"
              >
                <Text className="text-[9px] font-extrabold tracking-wider text-[#b45309]">
                  UNPAID (Mark Paid)
                </Text>
              </Pressable>
            )}

            {bill.status === "AUTO-PAY" && (
              <View className="bg-[#ecfdf5] px-2 py-0.5 rounded-[6px]">
                <Text className="text-[9px] font-extrabold tracking-wider text-[#059669]">
                  AUTO-PAY
                </Text>
              </View>
            )}

            {bill.status === "PAID" && (
              <View className="w-[20px] h-[20px] rounded-full bg-[#00c46a] items-center justify-center">
                <Text className="text-white text-[11px] font-bold">✓</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={8}
            className="w-[28px] h-[28px] rounded-full bg-red-50 border border-red-100 items-center justify-center active:bg-red-100 ml-1"
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <Text className="text-[12px]">🗑️</Text>
            )}
          </Pressable>
        </View>
      </View>

      {!isLast && <View className="h-[1px] bg-[#f1f5f9] my-1.5" />}
    </View>
  );
}
