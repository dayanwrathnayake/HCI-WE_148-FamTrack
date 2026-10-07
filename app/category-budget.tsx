import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBottomNav } from "../components/AppBottomNav";
import { CircularProgressRing } from "../components/CircularProgressRing";
import { Icon } from "../components/Icon";
import { DEFAULT_CATEGORY_SHARES } from "../constants/categories";
import { useBudget } from "../context/BudgetContext";
import { getCategoryAllocations } from "../utils/categories";
import { getMonthYearLabel } from "../utils/members";

// Nothing is spent until the expense phase provides real totals (overall and per category).
const MONTHLY_SPENT = 0;
const CATEGORY_SPENT = 0;

export default function CategoryBudgetScreen() {
  const { status, budget, monthKey } = useBudget();

  const monthlyBudget = budget?.amount ?? 0;
  const monthlyLeft = monthlyBudget - MONTHLY_SPENT;
  const percentUsed = monthlyBudget > 0 ? MONTHLY_SPENT / monthlyBudget : 0;

  // Rupee allocations are derived from the saved percentages; "Other" is the remainder, so the rows
  // always total exactly the monthly budget.
  const allocations = useMemo(
    () => getCategoryAllocations(monthlyBudget, budget?.categories ?? DEFAULT_CATEGORY_SHARES),
    [monthlyBudget, budget?.categories],
  );

  const [year, month] = monthKey.split("-").map(Number);
  const monthLabel = getMonthYearLabel(new Date(year, month - 1, 1));
  const noteText =
    status === "none"
      ? `No budget set for ${monthLabel} yet.`
      : status === "error"
        ? "Couldn't load this month's budget. Please try again later."
        : null;

  const handleBack = () => router.back();
  const handleEditBudget = () => router.push("/edit-family-budget");

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
              <Icon name="arrowLeft" size={16} />
            </Pressable>
            <Text style={styles.headerTitle}>Category Budget</Text>
          </View>

          <View style={styles.summaryCard}>
            <CircularProgressRing
              progress={percentUsed}
              size={104}
              strokeWidth={13}
              trackColor="#edf0f3"
              progressColor="#00c46a"
              centerLabel={`${Math.round(percentUsed * 100)}%`}
              centerSubLabel="used"
            />
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryLabel}>Monthly Budget</Text>
              <Text style={styles.summaryAmount}>
                Rs {monthlyBudget.toLocaleString("en-US")}
              </Text>
              <View style={styles.summaryStatsRow}>
                <View style={[styles.summaryStat, { backgroundColor: "#f4f6f8" }]}>
                  <Text style={[styles.summaryStatLabel, { color: "#8a93a0" }]}>Spent</Text>
                  <Text style={[styles.summaryStatValue, { color: "#0e1116" }]}>
                    Rs {MONTHLY_SPENT.toLocaleString("en-US")}
                  </Text>
                </View>
                <View style={[styles.summaryStat, { backgroundColor: "#e8f8f0" }]}>
                  <Text style={[styles.summaryStatLabel, { color: "#4c8e6e" }]}>Left</Text>
                  <Text style={[styles.summaryStatValue, { color: "#00854b" }]}>
                    Rs {monthlyLeft.toLocaleString("en-US")}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {noteText ? <Text style={styles.noteText}>{noteText}</Text> : null}

          <View style={styles.categoryHeaderRow}>
            <Text style={styles.categoryHeaderTitle}>Category</Text>
            <Text style={styles.categoryHeaderSubtitle}>share of budget</Text>
          </View>

          <View style={styles.categoryList}>
            {allocations.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={[styles.categoryIconWrap, { backgroundColor: category.iconBackground }]}>
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                </View>
                <View style={styles.categoryBody}>
                  <View style={styles.categoryTopRow}>
                    <Text style={styles.categoryName}>{category.label}</Text>
                    <Text style={styles.categoryPercent}>{category.percentage}%</Text>
                  </View>
                  <View style={styles.categoryTrack}>
                    <View
                      style={[
                        styles.categoryFill,
                        {
                          width: `${(category.amount > 0 ? Math.min(1, CATEGORY_SPENT / category.amount) : 0) * 100}%`,
                          backgroundColor: category.fillColor,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryDetail}>
                    Rs {CATEGORY_SPENT.toLocaleString("en-US")} of Rs {category.amount.toLocaleString("en-US")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.editBudgetWrap}>
          <Pressable onPress={handleEditBudget} style={styles.editBudgetButton}>
            <Text style={styles.editBudgetText}>+ Edit Budget</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <AppBottomNav activeRouteName="budget" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  headerRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e1116",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
  },
  summaryCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  summaryDetails: {
    flex: 1,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  summaryAmount: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0e1116",
  },
  summaryStatsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  summaryStat: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  summaryStatLabel: {
    fontSize: 10.5,
    fontWeight: "400",
  },
  summaryStatValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  noteText: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    color: "#8a93a0",
  },
  categoryHeaderRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryHeaderTitle: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  categoryHeaderSubtitle: {
    fontSize: 11.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  categoryList: {
    marginTop: 12,
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 69,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIconWrap: {
    height: 34,
    width: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryEmoji: {
    fontSize: 15,
  },
  categoryBody: {
    flex: 1,
    gap: 4,
  },
  categoryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
  categoryPercent: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#0e1116",
  },
  categoryTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "#edf0f3",
    overflow: "hidden",
  },
  categoryFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryDetail: {
    fontSize: 10.5,
    fontWeight: "400",
    color: "#8a93a0",
  },
  editBudgetWrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
  },
  editBudgetButton: {
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1dcd9f",
    shadowColor: "#6a6e6c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  editBudgetText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#04240f",
  },
});
