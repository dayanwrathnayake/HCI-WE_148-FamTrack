import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategoryDefinition,
} from "../constants/categories";
import type { SelectableMember } from "../constants/expense";
import { useExpenses } from "../context/ExpenseContext";
import { useFamily } from "../context/FamilyContext";
import { getExpenseErrorMessage } from "../services/expenseService";
import { formatExpenseDate } from "../utils/expenses";
import { getAvatarPalette, getInitials } from "../utils/members";

export default function AddExpenseScreen() {
  const { activeMembers, currentMember } = useFamily();
  const { addExpense, permission } = useExpenses();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => formatExpenseDate(new Date()));
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategoryDefinition | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const memberOptions = useMemo<SelectableMember[]>(
    () =>
      activeMembers.map((member) => {
        const palette = getAvatarPalette(member.id);
        return {
          key: member.id,
          name: member.id === currentMember?.id ? "You" : member.displayName,
          initials: getInitials(member.displayName),
          avatarColor: palette.background,
          avatarTextColor: palette.text,
        };
      }),
    [activeMembers, currentMember],
  );

  const [payers, setPayers] = useState<SelectableMember[]>([]);
  const [splitMembers, setSplitMembers] = useState<SelectableMember[]>([]);

  const isValid =
    amount.trim().length > 0 &&
    Number(amount.replace(/,/g, "")) > 0 &&
    selectedCategory !== null &&
    (permission ? permission.allowed : true) &&
    !submitting;

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
    if (!isValid || !selectedCategory) return;
    setErrorText(null);
    setSubmitting(true);
    try {
      await addExpense({
        categoryId: selectedCategory.id,
        amountText: amount,
        dateText: date,
        paidBy: payers[0]?.key ?? null,
        splitAmong: splitMembers.map((member) => member.key),
        note,
      });
      handleBack();
    } catch (error) {
      setErrorText(getExpenseErrorMessage(error));
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
        {permission && !permission.allowed ? (
          <Text className="text-[12.5px] font-medium text-[#c2410c] text-center">
            {permission.reason}
          </Text>
        ) : permission && permission.pending ? (
          <Text className="text-[12.5px] font-medium text-[#8a93a0] text-center">
            Your expense will be sent to the family admin for approval.
          </Text>
        ) : null}

        <View className="bg-white rounded-[20px] p-5 shadow-sm shadow-black/10 elevation-2">
          <Pressable
            className="flex-row items-center h-[48px] rounded-[12px] border border-[#e1e5ea] px-4 gap-3 bg-white"
            onPress={() => setShowCategoryPicker((v) => !v)}
          >
            {selectedCategory ? (
              <>
                <Text className="text-[18px]">{selectedCategory.emoji}</Text>
                <Text className="flex-1 text-[15px] font-medium text-[#111827]">
                  {selectedCategory.label}
                </Text>
              </>
            ) : (
              <Text className="flex-1 text-[14px] font-medium text-[#9ca3af]">
                Select category...
              </Text>
            )}

            <Text className="text-[14px] text-[#8a93a0]">
              {showCategoryPicker ? "▴" : "▾"}
            </Text>
          </Pressable>

          {showCategoryPicker && (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {EXPENSE_CATEGORIES.map((cat) => {
                const active = cat.id === selectedCategory?.id;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryPicker(false);
                    }}
                    className={`flex-row items-center gap-1.5 h-[36px] rounded-full px-3 border ${
                      active
                        ? "bg-[#e8f8f0] border-[#00c46a]"
                        : "bg-white border-[#e1e5ea]"
                    }`}
                  >
                    <Text className="text-[14px]">{cat.emoji}</Text>
                    <Text
                      className={`text-[13px] font-semibold ${
                        active ? "text-[#00854b]" : "text-[#5d6673]"
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

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
            allMembers={memberOptions}
            onAdd={(m) => setPayers([m])}
            onRemove={(k) => setPayers((p) => p.filter((x) => x.key !== k))}
          />

          <MemberSelector
            label="Split between"
            selectedMembers={splitMembers}
            allMembers={memberOptions}
            onAdd={(m) => setSplitMembers((s) => [...s, m])}
            onRemove={(id) =>
              setSplitMembers((s) => s.filter((x) => x.key !== id))
            }
          />
          <Text className="text-[11.5px] text-[#8a93a0] mt-2">
            Payer defaults to you. Split defaults to everyone in the family.
          </Text>

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
        {receiptUri ? (
          <Text className="text-[12px] font-medium text-[#8a93a0] text-center -mt-2">
            Receipts aren&apos;t saved yet. This photo won&apos;t be uploaded
            with the expense.
          </Text>
        ) : null}

        {errorText ? (
          <Text className="text-[12.5px] font-medium text-[#c2410c] text-center">
            {errorText}
          </Text>
        ) : null}

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
