import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CategoryPicker } from "../components/CategoryPicker";
import { Icon } from "../components/Icon";
import { MemberSelector } from "../components/MemberSelector";
import { ReceiptPicker } from "../components/ReceiptPicker";
import { CategoryOption } from "../constants/expense";
import { useExpenses } from "../context/ExpenseContext";
import { useFamily } from "../context/FamilyContext";
import type { MemberRecord } from "../utils/members";

export default function AddExpenseScreen() {
  const { family, activeMembers, currentMember } = useFamily();
  const { addExpense } = useExpenses();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryOption | null>(null);

  const [customPayers, setCustomPayers] = useState<MemberRecord[] | null>(null);
  const [splitMembers, setSplitMembers] = useState<MemberRecord[]>([]);

  const payers = useMemo(() => {
    if (customPayers !== null) return customPayers;
    return currentMember ? [currentMember] : [];
  }, [customPayers, currentMember]);

  const isValid =
    amount.trim().length > 0 &&
    Number(amount.replace(/,/g, "")) > 0 &&
    selectedCategory !== null &&
    payers.length > 0;

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
        if (digits.length >= 5) {
          formatted = `${day}/${month}/${digits.slice(4, 8)}`;
        }
      }
    }
    setDate(formatted);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const handleAddExpense = async () => {
    if (
      !isValid ||
      !selectedCategory ||
      payers.length === 0 ||
      !family ||
      !currentMember
    )
      return;

    try {
      setSubmitting(true);
      const parsedAmount = Math.round(Number(amount.replace(/,/g, "")));

      let y: number, m: number, d: number;
      if (date.length === 10) {
        const parts = date.split("/").map(Number);
        d = parts[0];
        m = parts[1] - 1;
        y = parts[2];
      } else {
        const today = new Date();
        d = today.getDate();
        m = today.getMonth();
        y = today.getFullYear();
      }
      const utcExpenseDate = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));

      const isAdmin =
        currentMember.role === "admin" ||
        family.ownerId === currentMember.userId;
      const calculatedStatus = isAdmin ? "Shared" : "Pending";

      await addExpense({
        title: note.trim() !== "" ? note.trim() : selectedCategory.label,
        categoryId: selectedCategory.key,
        amount: parsedAmount,
        paidBy: payers[0].id,
        splitAmong:
          splitMembers.length > 0
            ? splitMembers.map((mem) => mem.id)
            : [payers[0].id],
        status: calculatedStatus,
        date: utcExpenseDate,
        note: note.trim(),
        receiptUri: receiptUri,
      });

      router.replace("/expense-history");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to add expense. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
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
          Add Expense
        </Text>
        <View className="w-[34px]" />
      </View>

      <ScrollView
        className="flex-1 bg-[#f5f6fa]"
        contentContainerStyle={{ padding: 20, paddingBottom: 80, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-[20px] p-5 shadow-sm shadow-black/10 elevation-2">
          <CategoryPicker
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />

          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-2">
                Amount
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
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-[13px] font-semibold text-[#1f2937] mb-2">
                Date
              </Text>
              <View className="flex-row items-center h-[48px] rounded-[14px] border border-[#e1e5ea] bg-white px-3.5">
                <TextInput
                  className="flex-1 min-w-0 text-[14px] font-medium text-[#1f2937] p-0 outline-none"
                  value={date}
                  onChangeText={handleDateChange}
                  placeholder="DD/MM/YY"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  maxLength={10}
                />
                <Text className="text-[15px] ml-1 shrink-0">📅</Text>
              </View>
            </View>
          </View>

          <MemberSelector
            label="Payer"
            selectedMembers={payers}
            allMembers={activeMembers}
            onAdd={(m) => setCustomPayers([...payers, m])}
            onRemove={(id) =>
              setCustomPayers(payers.filter((x) => x.id !== id))
            }
          />

          <MemberSelector
            label="Split between"
            selectedMembers={splitMembers}
            allMembers={activeMembers}
            onAdd={(m) => setSplitMembers((s) => [...s, m])}
            onRemove={(id) =>
              setSplitMembers((s) => s.filter((x) => x.id !== id))
            }
          />

          <Text className="text-[13px] font-semibold text-[#111827] mt-4 mb-2">
            Note / Title
          </Text>
          <TextInput
            className="h-[72px] rounded-[12px] border border-[#e1e5ea] bg-white px-3.5 pt-3 text-[14px] text-[#111827] outline-none"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note or custom title..."
            placeholderTextColor="#c6ccd4"
            multiline
            textAlignVertical="top"
          />
        </View>

        <ReceiptPicker
          receiptUri={receiptUri}
          onSelectReceipt={(uri) => setReceiptUri(uri)}
          onRemoveReceipt={() => setReceiptUri(null)}
        />

        <View className="flex-row gap-3">
          <Pressable
            className="flex-1 h-[50px] rounded-full items-center justify-center bg-white border border-gray-300 shadow-sm shadow-black/10 elevation-1"
            onPress={handleBack}
            disabled={submitting}
          >
            <Text className="text-[15px] font-semibold text-gray-700">
              Cancel
            </Text>
          </Pressable>

          <Pressable
            className="flex-[1.4] h-[50px] rounded-full items-center justify-center flex-row gap-2"
            style={{
              backgroundColor: isValid && !submitting ? "#05bf78" : "#a0d9c0",
              shadowColor: isValid ? "#00c46a" : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isValid ? 0.3 : 0,
              shadowRadius: 8,
              elevation: isValid ? 4 : 0,
            }}
            disabled={!isValid || submitting}
            onPress={handleAddExpense}
          >
            {submitting && <ActivityIndicator color="#ffffff" size="small" />}
            <Text className="text-[15px] font-bold text-white">
              {submitting ? "Saving..." : "Add Expense"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
