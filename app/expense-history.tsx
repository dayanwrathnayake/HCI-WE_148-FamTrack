import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { Icon } from "../components/Icon";
import { HistoryItemRow } from "../components/HistoryItemRow";
import { EXPENSE_CATEGORIES, getExpenseCategory } from "../constants/categories";
import type { HistoryItem } from "../constants/history";
import { useExpenses } from "../context/ExpenseContext";
import { useFamily } from "../context/FamilyContext";
import type { ExpenseCategoryId } from "../types/models";
import {
  getExpenseTime,
  groupExpensesByDay,
  type ExpenseRecord,
} from "../utils/expenses";
import { getMonthYearLabel } from "../utils/members";

const ALL_CATEGORIES = "all";

// "All", then every canonical category (Rent, Utilities and Housing no longer exist).
const CATEGORY_CHIPS: { id: ExpenseCategoryId | typeof ALL_CATEGORIES; label: string }[] = [
  { id: ALL_CATEGORIES, label: "All" },
  ...EXPENSE_CATEGORIES.map((category) => ({ id: category.id, label: category.label })),
];

export default function ExpenseHistoryScreen() {
  const { expenses, totals, loadPreviousMonthSpent } = useExpenses();
  const { members, currentMember } = useFamily();
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryId | typeof ALL_CATEGORIES>(
    ALL_CATEGORIES,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Last month's SHARED spending, for the "vs last month" badge. null until (or unless) it is known.
  const [previousSpent, setPreviousSpent] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadPreviousMonthSpent().then((value) => {
      if (!cancelled) setPreviousSpent(value);
    });
    return () => {
      cancelled = true;
    };
  }, [loadPreviousMonthSpent]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const payerName = (expense: ExpenseRecord) => {
    const member = members.find((m) => m.id === expense.paidBy);
    if (!member) return "Paid by someone";
    return member.id === currentMember?.id ? "Paid by you" : `Paid by ${member.displayName}`;
  };

  const toHistoryItem = (expense: ExpenseRecord): HistoryItem => {
    const category = getExpenseCategory(expense.categoryId);
    return {
      id: expense.id,
      title: expense.note.trim() !== "" ? expense.note.trim() : expense.title,
      category: category.label,
      time: getExpenseTime(expense),
      payerText: payerName(expense),
      amount: expense.amount,
      status: expense.status,
      iconBg: category.iconBackground,
      iconEmoji: category.emoji,
    };
  };

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matching = expenses.filter((expense) => {
      const matchesCategory = selectedCategory === ALL_CATEGORIES || expense.categoryId === selectedCategory;
      if (!matchesCategory) return false;
      if (query === "") return true;
      const payer = members.find((m) => m.id === expense.paidBy)?.displayName ?? "";
      return (
        expense.title.toLowerCase().includes(query) ||
        expense.note.toLowerCase().includes(query) ||
        payer.toLowerCase().includes(query) ||
        getExpenseCategory(expense.categoryId).label.toLowerCase().includes(query)
      );
    });
    return groupExpensesByDay(matching);
  }, [selectedCategory, searchQuery, expenses, members]);

  // Hidden when last month has no shared spending to compare with.
  const changePercent =
    previousSpent !== null && previousSpent > 0
      ? ((totals.spent - previousSpent) / previousSpent) * 100
      : null;

  return (
    <View className="flex-1 bg-white">
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
            Expense History
          </Text>

          <View className="w-[34px]" />
        </View>

        <ScrollView
          className="flex-1 bg-[#f5f6fa]"
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-[22px] p-5 flex-row items-center justify-between"
            style={{
              backgroundColor: "#05bf78",
              shadowColor: "#00c46a",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <View>
              <Text className="text-[13px] font-medium text-white/90">
                Total Spent
              </Text>
              <Text className="text-[26px] font-extrabold text-white mt-0.5">
                Rs {totals.spent.toLocaleString("en-US")}
              </Text>
              <Text className="text-[12px] font-medium text-white/80 mt-0.5">
                This Month
                {totals.pendingCount > 0 ? ` · ${totals.pendingCount} pending approval` : ""}
              </Text>
            </View>

            {changePercent !== null ? (
              <View className="items-end">
                <View className="flex-row items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                  <Text className="text-white text-[13px] font-bold">
                    {changePercent >= 0 ? "↑" : "↓"}
                  </Text>
                  <Text className="text-white text-[13px] font-bold">
                    {Math.abs(changePercent).toFixed(1)}%
                  </Text>
                </View>
                <Text className="text-white/80 text-[11px] font-medium mt-1">
                  vs last month
                </Text>
              </View>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORY_CHIPS.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`h-[34px] px-4 rounded-full items-center justify-center border ${
                    active
                      ? "bg-[#05bf78] border-[#05bf78]"
                      : "bg-[#e5e7eb] border-transparent"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      active ? "text-white" : "text-[#4b5563]"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-[14px] font-bold tracking-wider text-[#1f2937] uppercase">
                {getMonthYearLabel()}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  setIsSearching((prev) => !prev);
                  if (isSearching) setSearchQuery("");
                }}
              >
                <Text className="text-[16px] text-gray-500">
                  {isSearching ? "✕" : "🔍"}
                </Text>
              </Pressable>
            </View>

            {/* Search Input Bar */}
            {isSearching && (
              <View className="flex-row items-center h-[42px] rounded-[12px] bg-white px-3 mt-2.5 border border-[#e1e5ea] shadow-sm shadow-black/5">
                <Text className="text-[14px] mr-2 text-gray-400">🔍</Text>
                <TextInput
                  className="flex-1 text-[13px] font-medium text-[#111827] p-0 outline-none"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by name, category, payer..."
                  placeholderTextColor="#9ca3af"
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={6}>
                    <Text className="text-[12px] text-gray-400 font-bold">
                      ✕
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {filteredGroups.length === 0 ? (
            <View className="bg-white rounded-[20px] p-8 items-center justify-center">
              <Text className="text-[14px] font-medium text-gray-400">
                No expenses found
              </Text>
            </View>
          ) : (
            filteredGroups.map((group) => (
              <View
                key={group.label}
                className="bg-white rounded-[22px] p-4 shadow-sm shadow-black/5 elevation-1"
              >
                <Text className="text-[14px] font-bold text-[#1f2937] mb-3">
                  {group.label}
                </Text>

                <View className="gap-3">
                  {group.expenses.map((expense, index) => (
                    <HistoryItemRow
                      key={expense.id}
                      item={toHistoryItem(expense)}
                      isLast={index === group.expenses.length - 1}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="home" />
    </View>
  );
}
