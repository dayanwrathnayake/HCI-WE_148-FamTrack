import { View, Text } from "react-native";
import { HistoryItem, ExpenseStatus } from "../constants/history";

const BADGE_STYLES: Record<
  ExpenseStatus,
  { bg: string; border: string; text: string }
> = {
  Shared: {
    bg: "bg-[#e8f8f0]",
    border: "border-[#9de3c0]",
    text: "text-[#00854b]",
  },
  Personal: {
    bg: "bg-[#eff6ff]",
    border: "border-[#bfdbfe]",
    text: "text-[#2563eb]",
  },
  Pending: {
    bg: "bg-[#fefce8]",
    border: "border-[#fef08a]",
    text: "text-[#ca8a04]",
  },
};

export function HistoryItemRow({
  item,
  isLast,
}: {
  item: HistoryItem;
  isLast: boolean;
}) {
  const badge = BADGE_STYLES[item.status] || BADGE_STYLES.Shared;

  return (
    <View key={item.id}>
      <View className="flex-row items-center justify-between py-1">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-[42px] h-[42px] rounded-full items-center justify-center"
            style={{ backgroundColor: item.iconBg }}
          >
            <Text className="text-[18px]">{item.iconEmoji}</Text>
          </View>

          <View className="flex-1">
            <Text className="text-[14px] font-bold text-[#111827]">
              {item.title}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Text className="text-[12px] text-[#6b7280]">
                {item.category}
              </Text>
              <Text className="text-[10px] text-[#9ca3af]">•</Text>
              <Text className="text-[12px] text-[#6b7280]">
                {item.payerText}
              </Text>
            </View>
            <Text className="text-[10px] text-[#9ca3af] mt-0.5">
              {item.time}
            </Text>
          </View>
        </View>

        <View className="items-end gap-1">
          <Text className="text-[14px] font-bold text-[#111827]">
            - RS {item.amount.toLocaleString("en-US")}
          </Text>
          <View
            className={`px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.border}`}
          >
            <Text className={`text-[10px] font-bold ${badge.text}`}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {!isLast && <View className="h-[1px] bg-gray-100 my-2" />}
    </View>
  );
}
