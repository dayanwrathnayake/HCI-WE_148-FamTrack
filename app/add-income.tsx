import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppBottomNav } from "../components/AppBottomNav";
import { IncomeHeader } from "../components/IncomeHeader";
import { DateSelector } from "../components/DateSelector";
import { INCOME_SOURCES, IncomeSource, type IncomeEntry, localDate, SOURCE_STYLE } from "../constants/income";
import { useIncome } from "../context/IncomeContext";
import { useAuth } from "../context/AuthContext";
import { useFamily } from "../context/FamilyContext";
import { getIncome, incomeErrorMessage } from "../services/incomeService";
import { parseIncomeAmount, parseIncomeDate } from "../utils/income";
import { getInitials } from "../utils/members";

export default function AddIncomeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, profile, retryProfile } = useAuth();
  const { family, currentMember, status, retryFamily } = useFamily();
  const familyId = family?.id;
  const [attempt, setAttempt] = useState(0);
  const key = id && family && user ? `${user.uid}:${family.id}:${id}:${attempt}` : null;
  const [loaded, setLoaded] = useState<{ key: string; entry: IncomeEntry | null; error: string } | null>(null);
  useEffect(() => {
    if (!id || !familyId || !key || status !== "ready") return;
    let active = true;
    getIncome(id, familyId).then(entry => { if (active) setLoaded({ key, entry, error: "" }); }).catch(error => { if (active) setLoaded({ key, entry: null, error: incomeErrorMessage(error) }); });
    return () => { active = false; };
  }, [id, familyId, key, status]);
  const pending = status === "loading" || status === "idle" || (status === "ready" && !!id && key !== loaded?.key);
  if (status !== "ready" || !profile || currentMember?.status !== "active" || (id && (!loaded?.entry || loaded.key !== key || loaded.entry.createdBy !== user?.uid))) {
    return <SafeAreaView style={styles.screen}><IncomeHeader title={id ? "Edit Income" : "Add Income"} onBack={() => router.replace("/income")} /><View style={styles.unavailable}>{pending ? <><ActivityIndicator color="#05bf78" /><Text>Loading income…</Text></> : <><Text style={styles.error}>{loaded?.key === key && loaded.error ? loaded.error : id ? "This income is unavailable, or you do not own it." : "An active family membership is needed to add income."}</Text><Pressable accessibilityRole="button" style={styles.cancel} onPress={() => { retryProfile(); retryFamily(); setAttempt(value => value + 1); }}><Text>Retry</Text></Pressable></>}</View><AppBottomNav activeRouteName="home" /></SafeAreaView>;
  }
  return <IncomeForm key={`${user?.uid}:${family?.id}:${id || "new"}`} existing={id ? loaded?.entry ?? undefined : undefined} name={profile.name} />;
}

function IncomeForm({ existing, name }: { existing?: IncomeEntry; name: string }) {
  const { addIncome, updateIncome } = useIncome();
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [source, setSource] = useState<IncomeSource>(existing?.source ?? "Salary");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [date, setDate] = useState(existing?.date ?? localDate());
  const [status, setStatus] = useState<"Received" | "Expected">(existing?.status ?? "Received");
  const [familyBudget, setFamilyBudget] = useState(existing?.familyBudget ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const back = () => { if (busy) return; if (router.canGoBack()) router.back(); else router.replace("/income"); };
  const save = async () => {
    if (busy) return;
    try { parseIncomeAmount(amount); parseIncomeDate(date); if (!title.trim()) throw new Error("Enter an income title."); }
    catch (error) { setError(incomeErrorMessage(error)); return; }
    setBusy(true); setError("");
    try {
      const input = { amountText: amount, source, title: title.trim(), date, status, familyBudget };
      if (existing) await updateIncome(existing, input); else await addIncome(input);
      router.replace({ pathname: "/income", params: { month: date.slice(0, 7), saved: String(Date.now()), action: existing ? "updated" : "added" } });
    } catch (error) { setError(incomeErrorMessage(error)); }
    finally { setBusy(false); }
  };
  return <View style={styles.screen}><SafeAreaView style={styles.screen} edges={["top"]}>
    <IncomeHeader title={existing ? "Edit Income" : "Add Income"} onBack={back} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>AMOUNT</Text>
        <View style={styles.amountField}><Text style={styles.currency}>Rs</Text><TextInput editable={!busy} accessibilityLabel="Amount" value={amount} onChangeText={text => setAmount(text.replace(/[^\d.]/g, ""))} placeholder="0.00" placeholderTextColor="#b0b5be" keyboardType="decimal-pad" style={styles.amountInput} maxLength={14} /></View>
        <Text style={styles.label}>INCOME SOURCE</Text><View style={styles.chips}>{INCOME_SOURCES.map(item => <Pressable key={item} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: source === item }} onPress={() => setSource(item)} style={[styles.chip, source === item && styles.selected]}><Text style={styles.chipText}>{SOURCE_STYLE[item].symbol} {item}</Text></Pressable>)}</View>
        <View style={styles.fieldRow}><View style={styles.flex}><Text style={styles.label}>TITLE</Text><TextInput editable={!busy} accessibilityLabel="Title" value={title} onChangeText={setTitle} placeholder="Ex: Monthly Salary" style={styles.input} maxLength={100} /></View><View style={styles.flex}><Text style={styles.label}>DATE</Text><DateSelector disabled={busy} value={date} onChange={setDate} /></View></View>
        <Text style={styles.label}>RECEIVED BY</Text><View style={[styles.member, styles.selected]}><View style={[styles.avatar, { backgroundColor: "#ffd795" }]}><Text style={styles.initials}>{getInitials(name)}</Text></View><Text style={styles.chipText}>Me · {name}</Text></View>
        <Text style={styles.label}>STATUS</Text><View style={styles.segment}>{(["Received", "Expected"] as const).map(item => <Pressable key={item} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: status === item }} onPress={() => setStatus(item)} style={[styles.segmentButton, status === item && styles.segmentActive]}><Text style={[styles.segmentText, status === item && styles.segmentSelectedText]}>{item}</Text></Pressable>)}</View>
        <View style={styles.options}>
          <View style={styles.option}><View style={[styles.optionIcon, { backgroundColor: "#e8f8f0" }]}><Text>⌂</Text></View><View style={styles.flex}><Text style={styles.optionTitle}>Family contribution</Text><Text style={styles.optionSubtitle}>Mark this income for the shared pool</Text></View><Switch disabled={busy} accessibilityLabel="Add to family budget" value={familyBudget} onValueChange={setFamilyBudget} trackColor={{ false: "#d9dfe7", true: "#00c878" }} thumbColor="white" /></View>
        </View>
        {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
        <View style={styles.buttons}><Pressable accessibilityRole="button" disabled={busy} onPress={back} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ busy, disabled: busy }} onPress={save} style={styles.save}>{busy ? <ActivityIndicator color="#062a1e" /> : <Text style={styles.saveText}>{existing ? "Update Income" : "Save Income"}</Text>}</Pressable></View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView><AppBottomNav activeRouteName="home" /></View>;
}
const styles = StyleSheet.create({
  unavailable: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center", gap: 15 },
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
