import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "../components/Icon";
import { MemberSelector } from "../components/MemberSelector";
import { BillCategory } from "../constants/bills";
import { ALL_MEMBERS, Member } from "../constants/expense";
import { useBills } from "../context/BillsContext";

type BillCategoryOption = {
  key: BillCategory;
  emoji: string;
  label: string;
  bg: string;
};

const BILL_CATEGORY_OPTIONS: BillCategoryOption[] = [
  { key: "Utilities", emoji: "⚡", label: "Utilities", bg: "#fef3c7" },
  { key: "Entertainment", emoji: "📺", label: "Entertainment", bg: "#fee2e2" },
  { key: "Utilities", emoji: "📶", label: "Broadband", bg: "#e0f2fe" },
  { key: "Utilities", emoji: "💧", label: "Water", bg: "#dbeafe" },
];

export default function AddBillScreen() {
  const { addBill } = useBills();

  const [billTitle, setBillTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isAutoPay, setIsAutoPay] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BillCategoryOption | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<Member[]>([]);

  const isValid =
    billTitle.trim().length > 0 &&
    amount.trim().length > 0 &&
    Number(amount.replace(/,/g, "")) > 0 &&
    selectedCategory !== null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/recurring-bills");
    }
  };

  const handleAmountChange = (text: string) => {
    const rawNumber = text.replace(/[^0-9]/g, "");
    if (!rawNumber) {
      setAmount("");
      return;
    }
    setAmount(Number(rawNumber).toLocaleString("en-US"));
  };

  const handleDateChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    let formatted = "";
    if (digits.length > 0) {
      let day =
        parseInt(digits.slice(0, 2), 10) > 31 ? "31" : digits.slice(0, 2);
      formatted = day;
      if (digits.length >= 3) {
        let month =
          parseInt(digits.slice(2, 4), 10) > 12 ? "12" : digits.slice(2, 4);
        formatted = `${day}/${month}`;
        if (digits.length >= 5)
          formatted = `${day}/${month}/${digits.slice(4, 8)}`;
      }
    }
    setDueDate(formatted);
  };

  const handleSaveBill = () => {
    if (!isValid || !selectedCategory) return;

    addBill({
      title: billTitle.trim(),
      category: selectedCategory.key,
      amount: Number(amount.replace(/,/g, "")),
      dueDateText: dueDate || "End of Month",
      isAutoPay: isAutoPay,
      assignedAvatar:
        assignedMembers.length > 0
          ? assignedMembers[0].avatar
          : ALL_MEMBERS[0].avatar,
      iconEmoji: selectedCategory.emoji,
      iconBg: selectedCategory.bg,
    });

    handleBack();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          className="h-[34px] w-[34px] rounded-full items-center justify-center bg-[#0e1116]"
        >
          <Icon name="arrowLeft" size={16} />
        </Pressable>

        <Text className="text-[20px] font-bold text-[#111827]">
          Add Recurring Bill
        </Text>

        <View className="w-[34px]" />
      </View>

      <ScrollView
        className="flex-1 bg-[#f8fafc]"
        contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-[22px] p-5 shadow-sm shadow-black/5 elevation-1 gap-1">
          <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
            Bill Name
          </Text>
          <TextInput
            className="h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 text-[15px] font-medium text-[#111827] outline-none"
            value={billTitle}
            onChangeText={setBillTitle}
            placeholder="e.g. SLT Fiber / CEB Bill"
            placeholderTextColor="#9ca3af"
          />

          <Text className="text-[13px] font-semibold text-[#1f2937] mt-4 mb-2">
            Category
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {BILL_CATEGORY_OPTIONS.map((cat, idx) => {
              const active = selectedCategory?.label === cat.label;
              return (
                <Pressable
                  key={idx}
                  onPress={() => setSelectedCategory(cat)}
                  className={`flex-row items-center gap-1.5 h-[36px] rounded-full px-3 border ${
                    active
                      ? "bg-[#e8f8f0] border-[#00c46a]"
                      : "bg-[#f8fafc] border-[#e1e5ea]"
                  }`}
                >
                  <Text className="text-[14px]">{cat.emoji}</Text>
                  <Text
                    className={`text-[12.5px] font-semibold ${
                      active ? "text-[#00854b]" : "text-[#64748b]"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
                Monthly Amount
              </Text>
              <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5 gap-2">
                <Text className="text-[13px] font-semibold text-[#6b7280]">
                  RS
                </Text>
                <TextInput
                  className="flex-1 text-[15px] font-medium text-[#1f2937] p-0 outline-none"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="numeric"
                  placeholder="4,500"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-1.5">
                Due Date
              </Text>
              <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5">
                <TextInput
                  className="flex-1 min-w-0 text-[13px] font-medium text-[#1f2937] p-0 outline-none"
                  value={dueDate}
                  onChangeText={handleDateChange}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text className="text-[15px] ml-1 shrink-0">📅</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-3 my-2 border-t border-b border-gray-100">
            <View className="flex-1 mr-3">
              <Text className="text-[13.5px] font-bold text-[#111827]">
                Auto-Debit / Auto-Pay
              </Text>
              <Text className="text-[11px] text-[#64748b] mt-0.5">
                Bill is automatically deducted each month
              </Text>
            </View>
            <Switch
              value={isAutoPay}
              onValueChange={setIsAutoPay}
              trackColor={{ false: "#e2e8f0", true: "#05bf78" }}
              thumbColor="#ffffff"
            />
          </View>

          <MemberSelector
            label="Assigned Member"
            selectedMembers={assignedMembers}
            allMembers={ALL_MEMBERS}
            onAdd={(m) => setAssignedMembers([m])}
            onRemove={() => setAssignedMembers([])}
          />
        </View>

        <View className="flex-row gap-3 mt-1">
          <Pressable
            className="flex-1 h-[50px] rounded-full items-center justify-center bg-white border border-gray-300 shadow-sm shadow-black/5 elevation-1"
            onPress={handleBack}
          >
            <Text className="text-[15px] font-semibold text-gray-700">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            className="flex-[1.4] h-[50px] rounded-full items-center justify-center"
            style={{
              backgroundColor: isValid ? "#05bf78" : "#a0d9c0",
              shadowColor: isValid ? "#00c46a" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isValid ? 0.3 : 0,
              shadowRadius: 8,
              elevation: isValid ? 4 : 0,
            }}
            disabled={!isValid}
            onPress={handleSaveBill}
          >
            <Text className="text-[15px] font-bold text-white">
              Add Recurring Bill
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
