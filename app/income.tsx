import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { INCOME_SOURCES, IncomeSource, localDate, money, SOURCE_STYLE } from "../constants/income";
import { useIncome } from "../context/IncomeContext";

export default function IncomeScreen() {
  const { entries } = useIncome();
  const { month, saved } = useLocalSearchParams<{ month?: string; saved?: string }>();
  const selectedMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : localDate().slice(0, 7);
  const period = new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const [filter, setFilter] = useState<"All" | IncomeSource>("All");
  useEffect(() => { if (!saved) return; const timer = setTimeout(() => router.setParams({ saved: undefined }), 3000); return () => clearTimeout(timer); }, [saved]);
  const monthlyEntries = entries.filter(entry => entry.date.startsWith(selectedMonth));
  const received = monthlyEntries.filter(entry => entry.status === "Received").reduce((sum, entry) => sum + entry.amount, 0);
  const expected = monthlyEntries.filter(entry => entry.status === "Expected").reduce((sum, entry) => sum + entry.amount, 0);
  const total = received + expected;
  const breakdown = INCOME_SOURCES.map(source => ({ source, amount: monthlyEntries.filter(entry => entry.source === source).reduce((sum, entry) => sum + entry.amount, 0) })).filter(item => item.amount > 0);
  const visible = monthlyEntries.filter(entry => filter === "All" || entry.source === filter).sort((a, b) => b.date.localeCompare(a.date));
  const dates = [...new Set(visible.map(entry => entry.date))];
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title="Income" subtitle={`Perera family · ${period}`} onBack={() => router.replace("/(tabs)/home")} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <LinearGradient colors={["#1acba3", "#00a76a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
        <Text style={styles.summaryLabel}>Total Income</Text><Text style={styles.total}>Rs {money(total)}</Text><Text style={styles.summaryLabel}>This Month</Text>
        <View style={styles.summaryRow}>{[{ label: "Received", amount: received }, { label: "Expected", amount: expected }].map(item => <View key={item.label} style={styles.summaryStat}><Text style={styles.statLabel}>{item.label}</Text><Text style={styles.statValue}>Rs {money(item.amount)}</Text></View>)}</View>
      </LinearGradient>
      <View style={styles.sources}><View style={styles.sourcesHeader}><Text style={styles.sourceTitle}>Income sources</Text><Text style={styles.share}>share</Text></View><View style={styles.bar}>{breakdown.map(item => <View key={item.source} style={{ flex: item.amount / total, backgroundColor: SOURCE_STYLE[item.source].color }} />)}</View><View style={styles.legend}>{breakdown.map(item => <View key={item.source} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: SOURCE_STYLE[item.source].color }]} /><Text style={styles.legendText}>{item.source} {Math.round(item.amount / total * 100)}%</Text></View>)}</View></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["All", ...INCOME_SOURCES] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
      <Text style={styles.period}>{period.toUpperCase()}</Text>
      {dates.map(date => <View key={date} style={styles.group}><Text style={styles.date}>{date === localDate() ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>{visible.filter(entry => entry.date === date).map((entry, index) => <View key={entry.id} style={[styles.entry, index > 0 && styles.divider]}><View style={[styles.entryIcon, { backgroundColor: SOURCE_STYLE[entry.source].background }]}><Text style={{ color: SOURCE_STYLE[entry.source].color, fontSize: 20 }}>{SOURCE_STYLE[entry.source].symbol}</Text></View><View style={styles.entryDetails}><Text style={styles.entryTitle}>{entry.title}</Text><Text style={styles.entrySubtitle}>{entry.source} · {entry.member}</Text></View><View style={styles.entryAmount}><Text style={[styles.amount, entry.status === "Expected" && styles.expectedAmount]}>+ Rs {money(entry.amount)}</Text><View style={[styles.status, entry.status === "Expected" && styles.expectedBadge]}><Text style={[styles.statusText, entry.status === "Expected" && styles.expectedText]}>{entry.status}</Text></View></View></View>)}</View>)}
      {!dates.length && <Text style={styles.empty}>No income in this category yet.</Text>}
    </ScrollView>
    <View style={styles.addWrap}><Pressable accessibilityRole="button" style={styles.add} onPress={() => router.push("/add-income")}><Text style={styles.addText}>+ Add Income</Text></Pressable></View>
    {!!saved && <View pointerEvents="none" style={styles.toast}><Text accessibilityLiveRegion="polite" style={styles.toastText}>✓ Income added successfully</Text></View>}
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" }, content: { padding: 22, paddingTop: 12, paddingBottom: 16, width: "100%", maxWidth: 550, alignSelf: "center", gap: 17 },
  summary: { borderRadius: 23, padding: 18, shadowColor: "#00a76a", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 4 }, summaryLabel: { fontSize: 10, color: "#d9fff0" }, total: { fontSize: 28, fontWeight: "800", color: "white", marginVertical: 4 }, summaryRow: { flexDirection: "row", gap: 10, marginTop: 18 }, summaryStat: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", padding: 12, borderRadius: 12 }, statLabel: { fontSize: 9, color: "#d9fff0" }, statValue: { fontSize: 12, fontWeight: "700", color: "white", marginTop: 3 },
  sources: { padding: 14, borderRadius: 19, borderWidth: 1, borderColor: "#e9edf1" }, sourcesHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, sourceTitle: { fontSize: 12, fontWeight: "700", color: "#101827" }, share: { fontSize: 10, color: "#9aa3af" }, bar: { flexDirection: "row", height: 9, borderRadius: 5, overflow: "hidden", backgroundColor: "#edf0f3" }, legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 9 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, dot: { width: 6, height: 6, borderRadius: 3 }, legendText: { fontSize: 9, color: "#7b8596" },
  filters: { gap: 7 }, filter: { backgroundColor: "#f2f4f7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }, filterActive: { backgroundColor: "#00c878" }, filterText: { fontSize: 10, color: "#7b8596" }, filterTextActive: { color: "#073b29" }, period: { fontSize: 9, fontWeight: "600", color: "#8b96a6", letterSpacing: 0.8 },
  group: { borderWidth: 1, borderColor: "#e9edf1", borderRadius: 20, padding: 13 }, date: { color: "#8792a4", fontSize: 10, marginBottom: 5 }, entry: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }, divider: { borderTopWidth: 1, borderTopColor: "#f2f3f5" }, entryIcon: { width: 35, height: 35, borderRadius: 13, alignItems: "center", justifyContent: "center" }, entryDetails: { flex: 1 }, entryTitle: { fontSize: 12, fontWeight: "600", color: "#19212f" }, entrySubtitle: { fontSize: 9, color: "#8b96a6", marginTop: 4 }, entryAmount: { alignItems: "flex-end", gap: 5 }, amount: { color: "#00ad68", fontSize: 12, fontWeight: "700" }, expectedAmount: { color: "#111827" }, status: { backgroundColor: "#e8f8f0", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }, statusText: { fontSize: 8, color: "#00ad68", fontWeight: "600" }, expectedBadge: { backgroundColor: "#fff7db" }, expectedText: { color: "#ba8c16" }, empty: { fontSize: 13, color: "#7b8596", textAlign: "center", padding: 25 },
  addWrap: { width: "100%", maxWidth: 550, alignSelf: "center", paddingHorizontal: 22, paddingVertical: 14 }, add: { height: 49, borderRadius: 18, backgroundColor: "#1acba3", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 3 }, addText: { fontSize: 14, fontWeight: "700", color: "#062a1e" }, toast: { position: "absolute", bottom: 78, alignSelf: "center", backgroundColor: "#e8faf1", borderRadius: 24, padding: 14 }, toastText: { color: "#07633d", fontSize: 12, fontWeight: "600" },
});
