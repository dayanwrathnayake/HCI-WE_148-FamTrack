import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { DateSelector } from "../components/DateSelector";
import { INCOME_SOURCES, IncomeSource, localDate, SOURCE_STYLE } from "../constants/income";
import { useIncome } from "../context/IncomeContext";

export default function AddIncomeScreen() {
  const { addIncome } = useIncome();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<IncomeSource>("Salary");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(localDate());
  const [member, setMember] = useState("Me");
  const [status, setStatus] = useState<"Received" | "Expected">("Received");
  const [familyBudget, setFamilyBudget] = useState(true);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [error, setError] = useState("");
  const back = () => router.canGoBack() ? router.back() : router.replace("/income");
  const save = () => {
    const numeric = Number(amount.replace(/,/g, ""));
    const parsed = new Date(`${date}T12:00:00`);
    if (!Number.isFinite(numeric) || numeric <= 0) { setError("Enter an amount greater than zero."); return; }
    if (!title.trim()) { setError("Enter an income title."); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || localDate(parsed) !== date) { setError("Select a valid date."); return; }
    addIncome({ amount: numeric, source, title: title.trim(), date, member, status, familyBudget, repeatMonthly });
    router.replace({ pathname: "/income", params: { month: date.slice(0, 7), saved: String(Date.now()) } });
  };
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title="Add Income" onBack={back} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>AMOUNT</Text>
        <View style={styles.amountField}><Text style={styles.currency}>Rs</Text><TextInput accessibilityLabel="Amount" value={amount} onChangeText={text => setAmount(text.replace(/[^\d.]/g, ""))} placeholder="0.00" placeholderTextColor="#b0b5be" keyboardType="decimal-pad" style={styles.amountInput} maxLength={14} /></View>
        <Text style={styles.label}>INCOME SOURCE</Text><View style={styles.chips}>{INCOME_SOURCES.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: source === item }} onPress={() => setSource(item)} style={[styles.chip, source === item && styles.selected]}><Text style={styles.chipText}>{SOURCE_STYLE[item].symbol} {item}</Text></Pressable>)}</View>
        <View style={styles.fieldRow}><View style={styles.flex}><Text style={styles.label}>TITLE</Text><TextInput accessibilityLabel="Title" value={title} onChangeText={setTitle} placeholder="Ex: Monthly Salary" style={styles.input} maxLength={100} /></View><View style={styles.flex}><Text style={styles.label}>DATE</Text><DateSelector value={date} onChange={setDate} /></View></View>
        <Text style={styles.label}>RECEIVED BY</Text><View style={styles.members}>{[{ name: "Me", initials: "ME", bg: "#ffd795" }, { name: "Mum", initials: "MU", bg: "#ffcde3" }, { name: "Dad", initials: "DA", bg: "#cbe1ff" }].map(item => <Pressable key={item.name} accessibilityRole="button" accessibilityState={{ selected: member === item.name }} onPress={() => setMember(item.name)} style={[styles.member, member === item.name && styles.selected]}><View style={[styles.avatar, { backgroundColor: item.bg }]}><Text style={styles.initials}>{item.initials}</Text></View><Text style={styles.chipText}>{item.name}</Text></Pressable>)}</View>
        <Text style={styles.label}>STATUS</Text><View style={styles.segment}>{(["Received", "Expected"] as const).map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: status === item }} onPress={() => setStatus(item)} style={[styles.segmentButton, status === item && styles.segmentActive]}><Text style={[styles.segmentText, status === item && styles.segmentSelectedText]}>{item}</Text></Pressable>)}</View>
        <View style={styles.options}>
          <View style={[styles.option, styles.divider]}><View style={[styles.optionIcon, { backgroundColor: "#e8f8f0" }]}><Text>⌂</Text></View><View style={styles.flex}><Text style={styles.optionTitle}>Add to family budget</Text><Text style={styles.optionSubtitle}>Counts towards the shared pool</Text></View><Switch accessibilityLabel="Add to family budget" value={familyBudget} onValueChange={setFamilyBudget} trackColor={{ false: "#d9dfe7", true: "#00c878" }} thumbColor="white" /></View>
          <View style={styles.option}><View style={[styles.optionIcon, { backgroundColor: "#edf2ff" }]}><Text>▣</Text></View><View style={styles.flex}><Text style={styles.optionTitle}>Repeat monthly</Text><Text style={styles.optionSubtitle}>Save as a monthly income</Text></View><Switch accessibilityLabel="Repeat monthly" value={repeatMonthly} onValueChange={setRepeatMonthly} trackColor={{ false: "#d9dfe7", true: "#00c878" }} thumbColor="white" /></View>
        </View>
        {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
        <View style={styles.buttons}><Pressable accessibilityRole="button" onPress={back} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" onPress={save} style={styles.save}><Text style={styles.saveText}>Save Income</Text></Pressable></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" }, content: { paddingHorizontal: 24, paddingBottom: 24, width: "100%", maxWidth: 550, alignSelf: "center" },
  label: { fontSize: 9, letterSpacing: 0.8, color: "#7c879b", marginBottom: 9, marginTop: 18 },
  amountField: { borderWidth: 1, borderColor: "#747474", borderRadius: 17, minHeight: 66, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }, currency: { fontSize: 11, color: "#737373" }, amountInput: { flex: 1, fontSize: 26, fontWeight: "800", padding: 0, color: "#111111" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 22, paddingHorizontal: 12, paddingVertical: 10 }, chipText: { fontSize: 11, color: "#263249" }, selected: { borderColor: "#00c878", backgroundColor: "#e9f8f0" },
  fieldRow: { flexDirection: "row", gap: 10 }, flex: { flex: 1 }, input: { borderWidth: 1, borderColor: "#e0e5ec", borderRadius: 12, paddingHorizontal: 12, height: 43, fontSize: 12, color: "#172033" },
  members: { flexDirection: "row", gap: 8 }, member: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 12, padding: 8 }, avatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" }, initials: { fontSize: 9, color: "#4c5567" },
  segment: { flexDirection: "row", backgroundColor: "#e7eaf0", borderRadius: 12, padding: 4 }, segmentButton: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 32, borderRadius: 9 }, segmentActive: { backgroundColor: "white" }, segmentText: { fontSize: 11, color: "#8b96a6" }, segmentSelectedText: { color: "#111827", fontWeight: "600" },
  options: { marginTop: 18, borderWidth: 1, borderColor: "#e7e9ee", borderRadius: 18, paddingHorizontal: 12, backgroundColor: "white", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3, elevation: 2 }, option: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 62 }, optionIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" }, optionTitle: { fontSize: 12, fontWeight: "600", color: "#111827" }, optionSubtitle: { fontSize: 9, color: "#8b96a6", marginTop: 3 }, divider: { borderBottomWidth: 1, borderBottomColor: "#f1f2f5" },
  buttons: { flexDirection: "row", gap: 10, marginTop: 18 }, cancel: { flex: 1, height: 49, borderWidth: 1, borderColor: "#e1e5ec", borderRadius: 17, alignItems: "center", justifyContent: "center" }, save: { flex: 1.3, height: 49, backgroundColor: "#1acba3", borderRadius: 17, alignItems: "center", justifyContent: "center" }, cancelText: { fontSize: 12, color: "#647084", fontWeight: "600" }, saveText: { fontSize: 12, color: "#061f18", fontWeight: "700" }, error: { color: "#b91c1c", fontSize: 12, marginTop: 12 },
});
