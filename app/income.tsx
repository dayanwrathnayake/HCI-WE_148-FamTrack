import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { SwipeIncomeRow } from "../components/SwipeIncomeRow";
import { INCOME_SOURCES, type IncomeSource, type IncomeEntry, money, SOURCE_STYLE } from "../constants/income";
import { useIncome } from "../context/IncomeContext";
import { useAuth } from "../context/AuthContext";
import { useFamily } from "../context/FamilyContext";
import { incomeErrorMessage } from "../services/incomeService";

function IncomeRow({ entry, name }: { entry: IncomeEntry; name: string }) {
  return <View style={styles.entry}>
    <View style={[styles.entryIcon, { backgroundColor: SOURCE_STYLE[entry.source].background }]}><Text style={{ color: SOURCE_STYLE[entry.source].color, fontSize: 20 }}>{SOURCE_STYLE[entry.source].symbol}</Text></View>
    <View style={styles.entryDetails}><Text style={styles.entryTitle}>{entry.title}</Text><Text style={styles.entrySubtitle}>{entry.source} · {name}</Text>{entry.familyBudget && <Text style={styles.contribution}>Family contribution</Text>}</View>
    <View style={styles.entryAmount}><Text style={[styles.amount, entry.status === "Expected" && styles.expectedAmount]}>+ Rs {money(entry.amount)}</Text><View style={[styles.status, entry.status === "Expected" && styles.expectedBadge]}><Text style={[styles.statusText, entry.status === "Expected" && styles.expectedText]}>{entry.status}</Text></View></View>
  </View>;
}
export default function IncomeScreen() {
  const { entries, status, error, monthKey, selectMonth, retryIncome, deleteIncome } = useIncome();
  const { user, retryProfile } = useAuth();
  const { family, members, retryFamily } = useFamily();
  const { month, saved, action } = useLocalSearchParams<{ month?: string; saved?: string; action?: string }>();
  const requestedMonth = month && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month) ? month : undefined;
  useEffect(() => { if (requestedMonth) selectMonth(requestedMonth); }, [requestedMonth, selectMonth]);
  const selectedMonth = requestedMonth || monthKey;
  const loading = status === "loading" || status === "idle" || selectedMonth !== monthKey;
  const ready = status === "ready" && !loading;
  const period = new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const [scope, setScope] = useState<"All" | "My" | "Family">("All");
  const [filter, setFilter] = useState<"All" | IncomeSource>("All");
  const [deleting, setDeleting] = useState<IncomeEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleted, setDeleted] = useState(false);
  useEffect(() => { if (!deleted) return; const timer = setTimeout(() => setDeleted(false), 3000); return () => clearTimeout(timer); }, [deleted]);
  useEffect(() => { if (!saved) return; const timer = setTimeout(() => router.setParams({ saved: undefined, action: undefined }), 3000); return () => clearTimeout(timer); }, [saved]);
  const scoped = entries.filter(entry => scope === "All" || (scope === "My" ? entry.createdBy === user?.uid : entry.createdBy !== user?.uid));
  const visible = scoped.filter(entry => filter === "All" || entry.source === filter).sort((a, b) => b.date.localeCompare(a.date) || b.createdAtMs - a.createdAtMs || a.id.localeCompare(b.id));
  const receivedCents = visible.filter(entry => entry.status === "Received").reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0);
  const expectedCents = visible.filter(entry => entry.status === "Expected").reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0);
  const totalCents = receivedCents + expectedCents;
  const breakdown = INCOME_SOURCES.map(source => ({ source, amount: visible.filter(entry => entry.source === source).reduce((sum, entry) => sum + Math.round(entry.amount * 100), 0) })).filter(item => item.amount > 0);
  const dates = [...new Set(visible.map(entry => entry.date))];
  const changeMonth = (offset: number) => { const date = new Date(`${selectedMonth}-01T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset); const next = date.toISOString().slice(0, 7); if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(next)) router.setParams({ month: next, saved: undefined, action: undefined }); };
  const confirmDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true); setDeleteError("");
    try { await deleteIncome(deleting); setDeleting(null); setDeleted(true); }
    catch (failure) { setDeleteError(incomeErrorMessage(failure)); }
    finally { setDeleteBusy(false); }
  };
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title="Income" subtitle={family ? family.name : "Income history"} onBack={() => router.replace("/(tabs)/home")} />
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.monthRow}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" style={styles.monthArrow} onPress={() => changeMonth(-1)}><Text style={styles.arrow}>‹</Text></Pressable><Text style={styles.monthTitle}>{period}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" style={styles.monthArrow} onPress={() => changeMonth(1)}><Text style={styles.arrow}>›</Text></Pressable></View>
      <View style={styles.scopeRow}>{(["All", "My", "Family"] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: scope === item }} onPress={() => setScope(item)} style={[styles.scopeButton, scope === item && styles.scopeActive]}><Text style={[styles.filterText, scope === item && styles.scopeTextActive]}>{item === "All" ? "All income" : `${item} income`}</Text></Pressable>)}</View>
      {loading ? <View style={styles.state}><ActivityIndicator color="#05bf78" /><Text style={styles.empty}>Loading income…</Text></View> : !ready ? <View style={styles.state}><Text style={styles.empty}>{status === "no-family" ? "An active family membership is needed to view income." : error}</Text><Pressable accessibilityRole="button" style={styles.retry} onPress={() => { retryProfile(); retryFamily(); retryIncome(); }}><Text style={styles.addText}>Retry</Text></Pressable></View> : <>
        <LinearGradient colors={["#1acba3", "#00a76a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
          <Text style={styles.summaryLabel}>{scope === "All" ? "Total Income" : `${scope} Income`}</Text><Text style={styles.total}>Rs {money(totalCents / 100)}</Text><Text style={styles.summaryLabel}>{period}{filter !== "All" ? ` · ${filter}` : ""}</Text>
          <View style={styles.summaryRow}>{[{ label: "Received", amount: receivedCents / 100 }, { label: "Expected", amount: expectedCents / 100 }].map(item => <View key={item.label} style={styles.summaryStat}><Text style={styles.statLabel}>{item.label}</Text><Text style={styles.statValue}>Rs {money(item.amount)}</Text></View>)}</View>
        </LinearGradient>
        <View style={styles.sources}><View style={styles.sourcesHeader}><Text style={styles.sourceTitle}>Income sources</Text><Text style={styles.share}>share</Text></View><View style={styles.bar}>{breakdown.map(item => <View key={item.source} style={{ flex: item.amount / totalCents, backgroundColor: SOURCE_STYLE[item.source].color }} />)}</View><View style={styles.legend}>{breakdown.map(item => <View key={item.source} style={styles.legendItem}><View style={[styles.dot, { backgroundColor: SOURCE_STYLE[item.source].color }]} /><Text style={styles.legendText}>{item.source} {Math.round(item.amount / totalCents * 100)}%</Text></View>)}</View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["All", ...INCOME_SOURCES] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
        <Text style={styles.period}>{period.toUpperCase()}</Text>
        {dates.map(date => <View key={date} style={styles.group}><Text style={styles.date}>{new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>{visible.filter(entry => entry.date === date).map((entry, index) => {
          const own = entry.createdBy === user?.uid;
          const name = own ? "Me" : members.find(member => member.id === entry.memberId && member.userId === entry.createdBy)?.displayName ?? "Former member";
          const row = <IncomeRow entry={entry} name={name} />;
          return <View key={entry.id} style={index > 0 ? styles.divider : undefined}>{own ? <SwipeIncomeRow onEdit={() => router.push({ pathname: "/add-income", params: { id: entry.id } })} onDelete={() => { setDeleteError(""); setDeleting(entry); }}>{row}</SwipeIncomeRow> : row}</View>;
        })}</View>)}
        {!dates.length && <Text style={styles.empty}>No income recorded for this month and filter.</Text>}
        {!!visible.some(entry => entry.createdBy === user?.uid) && <Text style={styles.hint}>Swipe your income left to edit or delete.</Text>}
      </>}
    </ScrollView>
    <View style={styles.addWrap}><Pressable accessibilityRole="button" disabled={!ready} style={[styles.add, !ready && styles.disabled]} onPress={() => router.push("/add-income")}><Text style={styles.addText}>+ Add Income</Text></Pressable></View>
    {(!!saved || deleted) && <View pointerEvents="none" style={styles.toast}><Text accessibilityLiveRegion="polite" style={styles.toastText}>✓ Income {deleted ? "deleted" : action === "updated" ? "updated" : "added"} successfully</Text></View>}
    <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => { if (!deleteBusy) setDeleting(null); }}><View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal><Text style={styles.dialogTitle}>Delete income?</Text><Text style={styles.dialogText}>Delete “{deleting?.title}”? This removes it from the family’s history and totals. This action cannot be undone.</Text>{!!deleteError && <Text accessibilityLiveRegion="polite" style={styles.deleteError}>{deleteError}</Text>}<Pressable accessibilityRole="button" disabled={deleteBusy} style={styles.deleteButton} onPress={confirmDelete}>{deleteBusy ? <ActivityIndicator color="white" /> : <Text style={styles.deleteText}>Delete income</Text>}</Pressable><Pressable accessibilityRole="button" disabled={deleteBusy} style={styles.cancelButton} onPress={() => setDeleting(null)}><Text>Cancel</Text></Pressable></View></View></Modal>
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f6f7f9", borderRadius: 15 }, monthArrow: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, arrow: { fontSize: 26, color: "#078653" }, monthTitle: { fontSize: 14, fontWeight: "700", color: "#17202e" }, scopeRow: { flexDirection: "row", gap: 4, borderRadius: 15, padding: 4, backgroundColor: "#f2f4f7" }, scopeButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 40, borderRadius: 12 }, scopeActive: { backgroundColor: "#e2f8ee" }, scopeTextActive: { color: "#078653", fontWeight: "700" }, state: { paddingVertical: 40, alignItems: "center" }, retry: { backgroundColor: "#e2f8ee", paddingHorizontal: 24, minHeight: 44, justifyContent: "center", borderRadius: 15 }, contribution: { fontSize: 9, color: "#078653", marginTop: 4 }, hint: { fontSize: 11, color: "#667085", textAlign: "center" }, disabled: { opacity: 0.5 }, deleteError: { color: "#b91c1c", fontSize: 12, lineHeight: 18, marginBottom: 15 },
  overlay: { flex: 1, backgroundColor: "rgba(16,24,42,0.4)", alignItems: "center", justifyContent: "center", padding: 24 }, dialog: { width: "100%", maxWidth: 380, backgroundColor: "white", padding: 24, borderRadius: 24 }, dialogTitle: { fontSize: 21, fontWeight: "700", color: "#17202e" }, dialogText: { fontSize: 14, lineHeight: 22, color: "#627087", marginVertical: 16 }, deleteButton: { minHeight: 48, backgroundColor: "#dc2626", borderRadius: 14, alignItems: "center", justifyContent: "center" }, deleteText: { color: "white", fontWeight: "700" }, cancelButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
  screen: { flex: 1, backgroundColor: "white" }, content: { padding: 22, paddingTop: 12, paddingBottom: 16, width: "100%", maxWidth: 550, alignSelf: "center", gap: 17 },
  summary: { borderRadius: 23, padding: 18, shadowColor: "#00a76a", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 4 }, summaryLabel: { fontSize: 10, color: "#d9fff0" }, total: { fontSize: 28, fontWeight: "800", color: "white", marginVertical: 4 }, summaryRow: { flexDirection: "row", gap: 10, marginTop: 18 }, summaryStat: { flex: 1, backgroundColor: "rgba(255,255,255,0.18)", padding: 12, borderRadius: 12 }, statLabel: { fontSize: 9, color: "#d9fff0" }, statValue: { fontSize: 12, fontWeight: "700", color: "white", marginTop: 3 },
  sources: { padding: 14, borderRadius: 19, borderWidth: 1, borderColor: "#e9edf1" }, sourcesHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, sourceTitle: { fontSize: 12, fontWeight: "700", color: "#101827" }, share: { fontSize: 10, color: "#9aa3af" }, bar: { flexDirection: "row", height: 9, borderRadius: 5, overflow: "hidden", backgroundColor: "#edf0f3" }, legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 9 }, legendItem: { flexDirection: "row", alignItems: "center", gap: 4 }, dot: { width: 6, height: 6, borderRadius: 3 }, legendText: { fontSize: 9, color: "#7b8596" },
  filters: { gap: 7 }, filter: { backgroundColor: "#f2f4f7", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }, filterActive: { backgroundColor: "#00c878" }, filterText: { fontSize: 10, color: "#7b8596" }, filterTextActive: { color: "#073b29" }, period: { fontSize: 9, fontWeight: "600", color: "#8b96a6", letterSpacing: 0.8 },
  group: { borderWidth: 1, borderColor: "#e9edf1", borderRadius: 20, padding: 13 }, date: { color: "#8792a4", fontSize: 10, marginBottom: 5 }, entry: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 }, divider: { borderTopWidth: 1, borderTopColor: "#f2f3f5" }, entryIcon: { width: 35, height: 35, borderRadius: 13, alignItems: "center", justifyContent: "center" }, entryDetails: { flex: 1 }, entryTitle: { fontSize: 12, fontWeight: "600", color: "#19212f" }, entrySubtitle: { fontSize: 9, color: "#8b96a6", marginTop: 4 }, entryAmount: { alignItems: "flex-end", gap: 5 }, amount: { color: "#00ad68", fontSize: 12, fontWeight: "700" }, expectedAmount: { color: "#111827" }, status: { backgroundColor: "#e8f8f0", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }, statusText: { fontSize: 8, color: "#00ad68", fontWeight: "600" }, expectedBadge: { backgroundColor: "#fff7db" }, expectedText: { color: "#ba8c16" }, empty: { fontSize: 13, color: "#7b8596", textAlign: "center", padding: 25 },
  addWrap: { width: "100%", maxWidth: 550, alignSelf: "center", paddingHorizontal: 22, paddingVertical: 14 }, add: { height: 49, borderRadius: 18, backgroundColor: "#1acba3", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 3 }, addText: { fontSize: 14, fontWeight: "700", color: "#062a1e" }, toast: { position: "absolute", bottom: 78, alignSelf: "center", backgroundColor: "#e8faf1", borderRadius: 24, padding: 14 }, toastText: { color: "#07633d", fontSize: 12, fontWeight: "600" },
});
