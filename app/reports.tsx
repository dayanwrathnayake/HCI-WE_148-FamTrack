import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { ProgressBar } from "../components/ProgressBar";
import { SpendingDonut } from "../components/SpendingDonut";
import { useExpenses } from "../context/ExpenseContext";
import { expenseDate } from "../utils/expenseDates";

const CATEGORY_COLORS: Record<string, string> = { Food: "#38b6f5", Groceries: "#05bf78", Entertainment: "#ff9466", Health: "#6a66ff", Travel: "#66dfa3", Transport: "#994cff", Utilities: "#f5b94e", Bills: "#f2789b", Rent: "#4b8df8", Housing: "#4b8df8", Other: "#9aa3af" };
const currency = (value: number) => `Rs ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export default function ReportsScreen() {
  const { historyGroups } = useExpenses();
  const [month, setMonth] = useState(() => expenseDate().slice(0, 7));
  const [scope, setScope] = useState<"All" | "Shared" | "Personal">("All");
  const period = new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const changeMonth = (amount: number) => {
    const date = new Date(`${month}-01T12:00:00`);
    date.setMonth(date.getMonth() + amount);
    setMonth(expenseDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`).slice(0, 7));
  };
  const monthly = historyGroups.flatMap(group => group.items.map(item => ({ ...item, date: item.date || expenseDate(group.dateLabel) }))).filter(item => item.date.startsWith(month));
  const paid = monthly.filter(item => item.status !== "Pending" && (scope === "All" || item.status === scope));
  const pending = monthly.filter(item => item.status === "Pending").reduce((sum, item) => sum + item.amount, 0);
  const total = paid.reduce((sum, item) => sum + item.amount, 0);
  const categoryMap = paid.reduce<Record<string, { amount: number; count: number }>>((map, item) => { const current = map[item.category] || { amount: 0, count: 0 }; map[item.category] = { amount: current.amount + item.amount, count: current.count + 1 }; return map; }, {});
  const categories = Object.entries(categoryMap).map(([name, value]) => ({ name, ...value, color: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other })).sort((a, b) => b.amount - a.amount);
  const back = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/home");
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title="Reports" onBack={back} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.monthRow}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.monthArrow}><Text style={styles.arrowText}>‹</Text></Pressable><Text style={styles.monthLabel}>{period}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.monthArrow}><Text style={styles.arrowText}>›</Text></Pressable></View>
      <View style={styles.filters}>{(["All", "Shared", "Personal"] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: scope === item }} onPress={() => setScope(item)} style={[styles.filter, scope === item && styles.filterActive]}><Text style={[styles.filterText, scope === item && styles.filterTextActive]}>{item === "All" ? "All spending" : item}</Text></Pressable>)}</View>
      <View style={styles.chartCard}><SpendingDonut categories={categories} total={total} /><Text style={styles.chartTitle}>Spending by category</Text><Text style={styles.chartSubtitle}>{scope === "All" ? "Shared and personal expenses" : `${scope} expenses`} · {paid.length} transactions</Text></View>
      
      {pending > 0 && <View style={styles.pending}><Text style={styles.pendingTitle}>{currency(pending)} pending this month</Text><Text style={styles.pendingText}>Not included in the spending total.</Text></View>}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Category breakdown</Text><Text style={styles.sectionSubtitle}>Share of spending</Text></View>
      {categories.length ? <View style={styles.categoryCard}>{categories.map((category, index) => <View key={category.name} style={[styles.category, index > 0 && styles.divider]} accessible accessibilityLabel={`${category.name}, ${currency(category.amount)}, ${(category.amount / total * 100).toFixed(1)} percent of spending`}>
        <View style={styles.categoryHeader}><View style={styles.categoryName}><View style={[styles.dot, { backgroundColor: category.color }]} /><Text style={styles.categoryTitle}>{category.name}</Text></View><Text style={styles.categoryAmount}>{currency(category.amount)}</Text></View>
        <ProgressBar progress={category.amount / total} height={9} trackColor="#eef0f6" fillColor={category.color} />
        <View style={styles.categoryFooter}><Text style={styles.smallText}>{category.count} {category.count === 1 ? "transaction" : "transactions"}</Text><Text style={styles.percentage}>{(category.amount / total * 100).toFixed(1)}%</Text></View>
      </View>)}</View> : <View style={styles.empty}><Text style={styles.emptyTitle}>No spending to report</Text><Text style={styles.emptyText}>Try another month or filter, or record an expense to see your breakdown.</Text><Pressable accessibilityRole="button" onPress={() => router.push("/add-expense")} style={styles.emptyButton}><Text style={styles.emptyButtonText}>+ Add Expense</Text></Pressable></View>}
      <Pressable accessibilityRole="button" onPress={() => router.push("/expense-history")} style={styles.historyButton}><Text style={styles.historyText}>View expense history</Text><Text style={styles.historyText}>›</Text></Pressable>
    </ScrollView>
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" }, content: { width: "100%", maxWidth: 550, alignSelf: "center", paddingHorizontal: 20, paddingTop: 6, paddingBottom: 25, gap: 16 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f6f7f9", borderRadius: 16, padding: 5 }, monthArrow: { width: 44, height: 40, alignItems: "center", justifyContent: "center" }, arrowText: { fontSize: 26, color: "#596478" }, monthLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  filters: { flexDirection: "row", backgroundColor: "#f2f4f6", padding: 4, borderRadius: 15 }, filter: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 12 }, filterActive: { backgroundColor: "#e2f8ee" }, filterText: { fontSize: 12, color: "#7c879b", fontWeight: "600" }, filterTextActive: { color: "#078653" },
  chartCard: { backgroundColor: "#f7f8fa", borderWidth: 1, borderColor: "#e9edf1", borderRadius: 24, paddingVertical: 18 }, chartTitle: { fontSize: 20, fontWeight: "700", color: "#17202e", textAlign: "center", marginTop: 8 }, chartSubtitle: { fontSize: 13, fontWeight: "500", lineHeight: 20, color: "#536174", textAlign: "center", marginTop: 7, paddingHorizontal: 16 },
  pending: { backgroundColor: "#fff8e8", borderRadius: 15, padding: 13 }, pendingTitle: { fontSize: 12, fontWeight: "600", color: "#9b6a14" }, pendingText: { fontSize: 11, color: "#9b815b", marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 5 }, sectionTitle: { fontSize: 15, fontWeight: "700", color: "#17202e" }, sectionSubtitle: { fontSize: 10, color: "#8b96a6" }, categoryCard: { backgroundColor: "#f7f8fa", paddingHorizontal: 17, borderRadius: 20 }, category: { paddingVertical: 17, gap: 10 }, divider: { borderTopWidth: 1, borderTopColor: "#e9edf1" }, categoryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, categoryName: { flexDirection: "row", alignItems: "center", gap: 7, flex: 1 }, dot: { width: 8, height: 8, borderRadius: 4 }, categoryTitle: { fontSize: 13, color: "#17202e", fontWeight: "600" }, categoryAmount: { fontSize: 13, fontWeight: "700", color: "#17202e" }, categoryFooter: { flexDirection: "row", justifyContent: "space-between" }, smallText: { fontSize: 10, color: "#8b96a6" }, percentage: { fontSize: 11, fontWeight: "600", color: "#627087" },
  empty: { backgroundColor: "#f7f8fa", padding: 24, borderRadius: 20, alignItems: "center", gap: 10 }, emptyTitle: { fontSize: 16, fontWeight: "700", color: "#17202e" }, emptyText: { fontSize: 12, textAlign: "center", lineHeight: 19, color: "#7d8896" }, emptyButton: { backgroundColor: "#05bf78", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20 }, emptyButtonText: { color: "white", fontSize: 12, fontWeight: "700" }, historyButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderWidth: 1, borderColor: "#d9eee3", borderRadius: 17 }, historyText: { fontSize: 13, fontWeight: "600", color: "#078653" },
});
