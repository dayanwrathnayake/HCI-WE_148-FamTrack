import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { HistoryItem } from "../constants/history";

type Props = {
  visible: boolean;
  item: HistoryItem | null;
  onClose: () => void;
  onDelete?: (item: HistoryItem) => Promise<void>;
};

export function ExpenseDetailModal({
  visible,
  item,
  onClose,
  onDelete,
}: Props) {
  const [deleting, setDeleting] = useState(false);
  if (!item) return null;

  const isShared = item.status === "Shared";

  const performDelete = async () => {
    if (!onDelete) return;
    try {
      setDeleting(true);
      await onDelete(item);
      onClose();
    } catch (error: any) {
      const msg = error.message || "Failed to delete expense.";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = () => {
    const message = `Are you sure you want to delete "${item.title}" (Rs ${item.amount.toLocaleString("en-US")})?`;

    if (Platform.OS === "web") {
      if (window.confirm(message)) {
        performDelete();
      }
      return;
    }

    Alert.alert("Delete Expense", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };

  return (
    <Modal
      visible={visible && item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-white rounded-t-[28px] p-6 gap-4 shadow-xl max-h-[85%]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-[44px] h-[44px] rounded-full items-center justify-center"
                style={{ backgroundColor: item.iconBg }}
              >
                <Text className="text-[20px]">{item.iconEmoji}</Text>
              </View>
              <View>
                <Text className="text-[17px] font-bold text-[#111827]">
                  {item.title}
                </Text>
                <Text className="text-[12px] text-[#64748b]">
                  {item.category} • {item.time}
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

          <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
            <View className="bg-[#f8fafc] rounded-[18px] p-4 border border-[#e2e8f0] gap-2.5">
              <View className="flex-row justify-between items-center">
                <Text className="text-[13px] text-[#64748b]">Amount:</Text>
                <Text className="text-[18px] font-extrabold text-[#111827]">
                  Rs {item.amount.toLocaleString("en-US")}
                </Text>
              </View>

              <View className="h-[1px] bg-gray-200/60" />

              <View className="flex-row justify-between items-center">
                <Text className="text-[13px] text-[#64748b]">Paid by:</Text>
                <Text className="text-[13px] font-bold text-[#111827]">
                  {item.payerText}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-[13px] text-[#64748b]">Status:</Text>
                <View
                  className={`px-2.5 py-0.5 rounded-full border ${
                    isShared
                      ? "bg-[#e8f8f0] border-[#9de3c0]"
                      : "bg-[#fefce8] border-[#fef08a]"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${
                      isShared ? "text-[#00854b]" : "text-[#ca8a04]"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {item.note && (
                <View className="mt-1 pt-2 border-t border-gray-200/60">
                  <Text className="text-[12px] text-[#64748b] font-medium">
                    Note:
                  </Text>
                  <Text className="text-[13px] text-[#111827] mt-0.5">
                    {item.note}
                  </Text>
                </View>
              )}
            </View>

            <View className="gap-2 mt-1">
              <Text className="text-[13px] font-bold text-[#111827]">
                Receipt / Bill Image:
              </Text>
              {item.receiptUri ? (
                <View className="rounded-[16px] overflow-hidden border border-[#e2e8f0] bg-black/5 items-center justify-center">
                  <Image
                    source={{ uri: item.receiptUri }}
                    className="w-full h-[220px]"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="bg-[#f8fafc] rounded-[16px] p-5 items-center justify-center border border-dashed border-[#cbd5e1]">
                  <Text className="text-[20px] mb-1">📄</Text>
                  <Text className="text-[12px] text-[#94a3b8] font-medium">
                    No receipt attached for this expense.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View className="flex-row gap-3 mt-2">
            <Pressable
              onPress={handleConfirmDelete}
              disabled={deleting}
              className="flex-1 h-[48px] rounded-full items-center justify-center bg-red-50 border border-red-200"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              {deleting ? (
                <ActivityIndicator color="#dc2626" size="small" />
              ) : (
                <Text className="text-[14px] font-bold text-red-600">
                  Delete
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={deleting}
              className="flex-[1.5] h-[48px] rounded-full bg-[#05bf78] items-center justify-center"
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Text className="text-[15px] font-bold text-white">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
