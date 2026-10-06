import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { Icon } from "../components/Icon";
import { useExpenses } from "../context/ExpenseContext";
import { HistoryItemRow } from "../components/HistoryItemRow";
import {
  HISTORY_CATEGORIES,
  HistoryCategoryFilter,
} from "../constants/history";

export default function ExpenseHistoryScreen() {
  const { historyGroups, totalSpent } = useExpenses();
  const [selectedCategory, setSelectedCategory] =
    useState<HistoryCategoryFilter>("All");
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const filteredGroups = useMemo(() => {
    return historyGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const matchesCategory =
            selectedCategory === "All" || item.category === selectedCategory;

          const query = searchQuery.trim().toLowerCase();
          const matchesSearch =
            query === "" ||
            item.title.toLowerCase().includes(query) ||
            item.payerText.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query);

          return matchesCategory && matchesSearch;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [selectedCategory, searchQuery, historyGroups]);

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
                Rs {totalSpent.toLocaleString("en-US")}
              </Text>
              <Text className="text-[12px] font-medium text-white/80 mt-0.5">
                This Month
              </Text>
            </View>

            <View className="items-end">
              <View className="flex-row items-center gap-1 bg-white/20 px-2.5 py-1 rounded-full">
                <Text className="text-white text-[13px] font-bold">↑</Text>
                <Text className="text-white text-[13px] font-bold">8.4%</Text>
              </View>
              <Text className="text-white/80 text-[11px] font-medium mt-1">
                vs last month
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {HISTORY_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
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
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View>
            <View className="flex-row items-center justify-between mt-1">
              <Text className="text-[14px] font-bold tracking-wider text-[#1f2937] uppercase">
                September 2026
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
                key={group.dateLabel}
                className="bg-white rounded-[22px] p-4 shadow-sm shadow-black/5 elevation-1"
              >
                <Text className="text-[14px] font-bold text-[#1f2937] mb-3">
                  {group.dateLabel}
                </Text>

                <View className="gap-3">
                  {group.items.map((item, index) => (
                    <HistoryItemRow
                      key={item.id}
                      item={item}
                      isLast={index === group.items.length - 1}
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
