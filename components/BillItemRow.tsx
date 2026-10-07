import { Text, View } from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { useFamily } from "../context/FamilyContext";
import { LiveRecurringBill } from "../context/BillsContext";
import { getAvatarPalette, getInitials } from "../utils/members";

type Props = {
  bill: LiveRecurringBill;
  isLast?: boolean;
};

export function BillItemRow({ bill, isLast = false }: Props) {
  const { members } = useFamily();

  const assignedMember = bill.assignedMemberId
    ? members.find((m) => m.id === bill.assignedMemberId)
    : null;

  const assignedInitials = assignedMember
    ? getInitials(assignedMember.displayName)
    : "";
  const assignedPalette = assignedMember
    ? getAvatarPalette(assignedMember.id)
    : null;

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

        <View className="items-end gap-1">
          <Text className="text-[14px] font-bold text-[#111827]">
            Rs {bill.amount.toLocaleString("en-US")}
          </Text>

          {bill.status === "UNPAID" && (
            <View className="bg-[#fef3c7] px-2 py-0.5 rounded-[6px]">
              <Text className="text-[9px] font-extrabold tracking-wider text-[#b45309]">
                UNPAID
              </Text>
            </View>
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
      </View>

      {!isLast && <View className="h-[1px] bg-[#f1f5f9] my-1.5" />}
    </View>
  );
}
