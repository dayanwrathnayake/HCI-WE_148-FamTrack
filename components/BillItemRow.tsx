import { Image, Text, View } from "react-native";
import { BillItem } from "../constants/bills";

type Props = {
  bill: BillItem;
};

export function BillItemRow({ bill }: Props) {
  return (
    <View
      className="bg-white rounded-[20px] p-4 flex-row items-center justify-between shadow-sm shadow-black/5 elevation-1"
      style={{ borderWidth: 1, borderColor: "#f1f5f9" }}
    >
      <View className="flex-row items-center gap-3 flex-1 mr-2">
        <View
          className="w-[42px] h-[42px] rounded-full items-center justify-center"
          style={{ backgroundColor: bill.iconBg }}
        >
          <Text className="text-[18px]">{bill.iconEmoji}</Text>
        </View>

        <View className="flex-1">
          <Text className="text-[14px] font-bold text-[#111827]">
            {bill.title}
          </Text>

          {bill.paidByText ? (
            <Text className="text-[11px] text-[#64748b] mt-0.5">
              {bill.paidByText}
            </Text>
          ) : (
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-[11px] text-[#64748b]">
                {bill.dueText} • {bill.dateText}
              </Text>
              {bill.assignedAvatar && (
                <Image
                  source={bill.assignedAvatar}
                  style={{ width: 18, height: 18, borderRadius: 9 }}
                  resizeMode="cover"
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
          <View className="w-[18px] h-[18px] rounded-full bg-[#05bf78] items-center justify-center">
            <Text className="text-white text-[10px] font-bold">✓</Text>
          </View>
        )}
      </View>
    </View>
  );
}
