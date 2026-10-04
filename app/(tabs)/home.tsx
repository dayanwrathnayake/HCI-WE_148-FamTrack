import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../../components/Icon";
import { ProgressBar } from "../../components/ProgressBar";
import type { IconName } from "../../constants/icons";

const TOTAL_BALANCE = "Rs 60,000.00";
const BUDGET_LEFT = "Rs 35,500.00";
const BUDGET_SPENT_TEXT = "-Rs 24,500.00 spent this month";
const BUDGET_PROGRESS = 24500 / 60000;

type CategoryPillData = {
  icon: IconName;
  background: string;
  name: string;
  spentText: string;
  spentColor: string;
};

const CATEGORY_PILLS: CategoryPillData[] = [
  {
    icon: "categoryEntertainment",
    background: "rgba(102,255,163,0.1)",
    name: "Entertainment",
    spentText: "Rs 3,430 spent",
    spentColor: "#1DA463",
  },
  {
    icon: "categoryFood",
    background: "rgba(255,148,102,0.1)",
    name: "Food",
    spentText: "Rs 430 spent",
    spentColor: "#FF9466",
  },
  {
    icon: "categoryBlue",
    background: "rgba(61,185,255,0.1)",
    name: "Entertainment",
    spentText: "Rs 3,430 spent",
    spentColor: "#3DB9FF",
  },
];

function CategoryPill({ pill }: { pill: CategoryPillData }) {
  return (
    <View style={[styles.categoryPill, { backgroundColor: pill.background }]}>
      <Icon name={pill.icon} size={24} />
      <View>
        <Text style={styles.categoryPillName}>{pill.name}</Text>
        <Text style={[styles.categoryPillAmount, { color: pill.spentColor }]}>
          {pill.spentText}
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [balanceHidden, setBalanceHidden] = useState(false);

  const handleFamilyBudgetPress = () => router.push("/(tabs)/budget");
  // TODO: Bills & Reminders belongs to another team member's module.
  const handleBillsPress = () => router.push("/recurring-bills");
  const handleAllBudgetsPress = () => router.push("/(tabs)/budget");
  const handleSpendPress = () => router.push("/expense-history");
  const handleIncomePress = () => {};
  const handleNotificationPress = () => {};

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>
              Hello <Text style={styles.greetingName}>Kamal</Text> 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              Ready to track your money..!
            </Text>
          </View>
          <Pressable onPress={handleNotificationPress} hitSlop={8}>
            <Icon name="notification" size={34} />
          </Pressable>
        </View>

        <View style={styles.financeContainer}>
          {/* Balance */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceIconWrap}>
              <Icon name="moneyBag" width={40} height={46} />
            </View>
            <View style={styles.balanceDetails}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text
                style={styles.balanceAmount}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {balanceHidden ? "Rs ••,•••.••" : TOTAL_BALANCE}
              </Text>
            </View>
            <Pressable
              onPress={() => setBalanceHidden((h) => !h)}
              style={styles.hideButton}
            >
              <Icon name="eye" size={18} />
              <Text style={styles.hideButtonText}>
                {balanceHidden ? "Show" : "Hide"}
              </Text>
            </Pressable>
          </View>

          {/* Spend / Income */}
          <View style={styles.quickActionsRow}>
            <Pressable
              onPress={handleSpendPress}
              style={[styles.quickActionButton, styles.spendButton]}
            >
              <Icon name="spend" width={31} height={31} />
              <Text style={styles.quickActionText}>Spend</Text>
            </Pressable>
            <Pressable
              onPress={handleIncomePress}
              style={[styles.quickActionButton, styles.incomeButton]}
            >
              <Icon name="income" width={29} height={31} />
              <Text style={styles.quickActionText}>Income</Text>
            </Pressable>
          </View>

          {/* Budget */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetHeaderRow}>
              <Text style={styles.budgetTitle}>Budget</Text>
              <Pressable
                onPress={handleAllBudgetsPress}
                style={styles.allBudgetsButton}
              >
                <Text style={styles.allBudgetsText}>All Budgets</Text>
              </Pressable>
            </View>

            <View style={styles.budgetContent}>
              <View style={styles.budgetTotalBlock}>
                <View>
                  <Text>
                    <Text style={styles.budgetLeftAmount}>{BUDGET_LEFT} </Text>
                    <Text style={styles.budgetLeftLabel}>left</Text>
                  </Text>
                  <Text style={styles.budgetSpentText}>
                    {BUDGET_SPENT_TEXT}
                  </Text>
                </View>
                <ProgressBar
                  progress={BUDGET_PROGRESS}
                  height={6}
                  trackColor="#EFEFFF"
                  fillColor="#6a66ff"
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryPillsRow}>
                  {CATEGORY_PILLS.map((pill, index) => (
                    <CategoryPill key={index} pill={pill} />
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Shortcuts */}
        <View style={styles.shortcutsContainer}>
          <View style={styles.shortcutsRow}>
            <Pressable
              onPress={handleFamilyBudgetPress}
              style={[styles.shortcutCard, styles.shortcutShadow]}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: "#e8f8f0" },
                ]}
              >
                <Image
                  source={require("../../assets/icons/family-budget.png")}
                  style={styles.shortcutIconImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.shortcutLabel}>Family Budget</Text>
            </Pressable>

            <Pressable
              onPress={handleBillsPress}
              style={[styles.shortcutCard, styles.shortcutShadow]}
            >
              <View
                style={[
                  styles.shortcutIconWrap,
                  { backgroundColor: "#fff1e6" },
                ]}
              >
                <Text style={styles.shortcutEmoji}>🔔</Text>
              </View>
              <Text style={styles.shortcutLabel}>Bills & Reminders</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
  },
  greetingName: {
    color: "#1dcd9f",
  },
  greetingSubtitle: {
    marginTop: 4,
    fontSize: 16.5,
    fontWeight: "700",
    color: "#999999",
  },
  financeContainer: {
    marginTop: 16,
    gap: 16,
    borderRadius: 22,
    padding: 12,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  balanceIconWrap: {
    height: 46,
    width: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceDetails: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#999999",
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#222222",
  },
  hideButton: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#efefef",
  },
  hideButtonText: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#000000",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 16,
  },
  quickActionButton: {
    height: 73,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderRadius: 12,
  },
  spendButton: {
    backgroundColor: "#222222",
  },
  incomeButton: {
    backgroundColor: "#1dcd9f",
  },
  quickActionText: {
    fontSize: 17.5,
    fontWeight: "700",
    color: "#ffffff",
  },
  budgetCard: {
    gap: 15,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  budgetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  budgetTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
  },
  allBudgetsButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(106,102,255,0.1)",
  },
  allBudgetsText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#6a66ff",
  },
  budgetContent: {
    gap: 25,
  },
  budgetTotalBlock: {
    gap: 12,
  },
  budgetLeftAmount: {
    fontSize: 28,
    fontWeight: "600",
    color: "#222222",
  },
  budgetLeftLabel: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#222222",
  },
  budgetSpentText: {
    fontSize: 13.5,
    color: "rgba(56,56,56,0.5)",
  },
  categoryPillsRow: {
    flexDirection: "row",
    gap: 10,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 35,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryPillName: {
    fontSize: 13.5,
    fontWeight: "500",
    color: "#000000",
  },
  categoryPillAmount: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  shortcutsContainer: {
    marginTop: 24,
    borderRadius: 22,
    padding: 12,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  shortcutsRow: {
    flexDirection: "row",
    gap: 12,
  },
  shortcutCard: {
    height: 89,
    flex: 1,
    justifyContent: "flex-end",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    padding: 14,
  },
  shortcutShadow: {
    shadowColor: "#0e1116",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  shortcutIconWrap: {
    height: 34,
    width: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    overflow: "hidden",
  },
  shortcutIconImage: {
    height: 34,
    width: 34,
  },
  shortcutEmoji: {
    fontSize: 16,
  },
  shortcutLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0e1116",
  },
});
