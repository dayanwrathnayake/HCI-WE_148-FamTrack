import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { BillItemRow } from "../components/BillItemRow";
import { Icon } from "../components/Icon";
import {
  BILL_CATEGORIES,
  BILL_SUMMARY,
  BillCategoryFilter,
  MOCK_PAID_BILLS,
  MOCK_UPCOMING_BILLS,
} from "../constants/bills";

export default function RecurringBillsScreen() {
  const [selectedCategory, setSelectedCategory] =
    useState<BillCategoryFilter>("all");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  const filteredUpcoming = useMemo(() => {
    if (selectedCategory === "all") return MOCK_UPCOMING_BILLS;
    return MOCK_UPCOMING_BILLS.filter(
      (b) => b.category.toLowerCase() === selectedCategory,
    );
  }, [selectedCategory]);

  const filteredPaid = useMemo(() => {
    if (selectedCategory === "all") return MOCK_PAID_BILLS;
    return MOCK_PAID_BILLS.filter(
      (b) => b.category.toLowerCase() === selectedCategory,
    );
  }, [selectedCategory]);

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
            Recurring Bills
          </Text>

          <View className="w-[34px]" />
        </View>

        <ScrollView
          className="flex-1 bg-[#f8fafc]"
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-[22px] p-5 gap-3"
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
              <Text className="text-[12px] font-bold tracking-wider text-white/90 uppercase">
                Total Monthly Commitments
              </Text>
              <Text className="text-[28px] font-extrabold text-white mt-1">
                Rs {BILL_SUMMARY.totalCommitments.toLocaleString("en-US")}
              </Text>
            </View>

            <View className="flex-row items-center gap-2 bg-[#d1fae5] px-3.5 py-2.5 rounded-[14px]">
              <Text className="text-[14px]">📅</Text>
              <Text className="text-[12.5px] font-bold text-[#065f46] flex-1">
                {BILL_SUMMARY.nextDueAlert}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {BILL_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  className={`h-[34px] px-4 rounded-full items-center justify-center border ${
                    active
                      ? "bg-[#05bf78] border-[#05bf78]"
                      : "bg-[#f1f5f9] border-transparent"
                  }`}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      active ? "text-white" : "text-[#475569]"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="gap-2.5">
            <Text className="text-[14px] font-bold text-[#111827]">
              Upcoming This Month
            </Text>

            {filteredUpcoming.length === 0 ? (
              <View className="bg-white rounded-[20px] p-6 items-center">
                <Text className="text-[13px] text-gray-400">
                  No upcoming bills in this category
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredUpcoming.map((bill) => (
                  <BillItemRow key={bill.id} bill={bill} />
                ))}
              </View>
            )}
          </View>

          <View className="gap-2.5">
            <Text className="text-[14px] font-bold text-[#111827]">
              Paid Bills This Month
            </Text>

            {filteredPaid.length === 0 ? (
              <View className="bg-white rounded-[20px] p-6 items-center">
                <Text className="text-[13px] text-gray-400">
                  No paid bills in this category
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {filteredPaid.map((bill) => (
                  <BillItemRow key={bill.id} bill={bill} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppBottomNav activeRouteName="budget" />
    </View>
  );
}
