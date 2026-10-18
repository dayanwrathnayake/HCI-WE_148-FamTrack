import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IncomeHeader } from "../components/IncomeHeader";
import { useFamily } from "../context/FamilyContext";
import { createShoppingList, prepareShoppingList, type ShoppingItemDraft } from "../services/shoppingService";

type Draft = ShoppingItemDraft & { id: number };
const blank = (id: number): Draft => ({ id, name: "", quantity: "1", price: "" });
const rupees = (cents: number) => `Rs ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function CreateShoppingListScreen() {
  const { family } = useFamily();
  const nextId = useRef(1);
  const saving = useRef(false);
  const [name, setName] = useState("");
  const [items, setItems] = useState<Draft[]>([blank(0)]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const update = (id: number, field: keyof ShoppingItemDraft, value: string) => {
    setItems(previous => previous.map(item => item.id === id ? { ...item, [field]: value } : item));
    setError("");
  };
  let total = 0;
  try { total = prepareShoppingList(name || "Preview", items.map(item => ({ ...item, name: item.name || "Item", price: item.price || "0" }))).totalCents; } catch { /* Incomplete draft: validate on Save. */ }
  const save = async () => {
    if (saving.current) return;
    setError("");
    try {
      prepareShoppingList(name, items);
      saving.current = true;
      setBusy(true);
      await createShoppingList(family?.id ?? "demo", name, items);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your list on this device. Please try again.");
    } finally { saving.current = false; setBusy(false); }
  };
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <IncomeHeader title="New Shopping List" onBack={() => { if (!busy) router.replace("/shopping-lists"); }} />
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {saved ? <View style={styles.card}>
          <Text style={styles.success}>✓ List created successfully</Text>
          <Text style={styles.heading}>{name.trim()}</Text>
          <Text style={styles.hint}>{items.length} items added to your shopping list.</Text>
          <Text style={styles.total}>{rupees(total)}</Text>
          <Pressable style={styles.primary} onPress={() => router.replace("/shopping-lists")}><Text style={styles.primaryText}>View Shopping Lists</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => { setName(""); setItems([blank(nextId.current++)]); setSaved(false); }}><Text style={styles.link}>Create another list</Text></Pressable>
        </View> : <>
          <View style={styles.intro}><Text style={styles.heading}>Plan your next shop</Text><Text style={styles.hint}>Make a list for {family?.name ?? "your family"}. Estimates help you plan before spending.</Text></View>
          <Text style={styles.label}>LIST NAME</Text>
          <TextInput accessibilityLabel="List name" editable={!busy} style={styles.input} value={name} onChangeText={value => { setName(value); setError(""); }} placeholder="Ex: Weekly groceries" maxLength={80} />
          <View style={styles.section}><Text style={styles.heading}>Shopping items</Text><Text style={styles.hint}>{items.length}/20 items</Text></View>
          {items.map((item, index) => <View key={item.id} style={styles.card}>
            <View style={styles.section}><Text style={styles.itemTitle}>Item {index + 1}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${index + 1}`} disabled={busy || items.length === 1} onPress={() => setItems(previous => previous.filter(row => row.id !== item.id))} style={styles.remove}><Text style={[styles.removeText, items.length === 1 && styles.muted]}>Remove</Text></Pressable></View>
            <Text style={styles.label}>ITEM NAME</Text><TextInput accessibilityLabel={`Item ${index + 1} name`} editable={!busy} style={styles.input} value={item.name} onChangeText={value => update(item.id, "name", value)} placeholder="Ex: Rice (1 kg bag)" maxLength={80} />
            <View style={styles.row}><View style={styles.flex}><Text style={styles.label}>QUANTITY</Text><TextInput accessibilityLabel={`Item ${index + 1} quantity`} editable={!busy} style={styles.input} value={item.quantity} onChangeText={value => update(item.id, "quantity", value)} keyboardType="number-pad" maxLength={3} /></View><View style={styles.flex}><Text style={styles.label}>UNIT PRICE (RS)</Text><TextInput accessibilityLabel={`Item ${index + 1} unit price`} editable={!busy} style={styles.input} value={item.price} onChangeText={value => update(item.id, "price", value)} placeholder="0.00" keyboardType="decimal-pad" maxLength={12} /></View></View>
          </View>)}
          <Pressable accessibilityRole="button" disabled={busy || items.length >= 20} style={styles.secondary} onPress={() => setItems(previous => [...previous, blank(nextId.current++)])}><Text style={styles.link}>{items.length >= 20 ? "20-item limit reached" : "+ Add another item"}</Text></Pressable>
          <View style={styles.summary}><Text style={styles.itemTitle}>Estimated total</Text><Text style={styles.total}>{rupees(total)}</Text><Text style={styles.hint}>Enter 0 for unknown prices. This list does not add expenses.</Text></View>
          {!!error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={save} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <Text style={styles.primaryText}>Create Shopping List</Text>}</Pressable>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" }, content: { width: "100%", maxWidth: 600, alignSelf: "center", padding: 20, paddingBottom: 36 },
  intro: { backgroundColor: "#ecfaf4", borderRadius: 20, padding: 18, marginBottom: 10 }, heading: { fontSize: 19, fontWeight: "700", color: "#172b25" }, hint: { fontSize: 12, lineHeight: 19, color: "#677b75", marginTop: 5 },
  label: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5, color: "#687b75", marginTop: 12, marginBottom: 7 }, input: { minHeight: 48, minWidth: 0, borderWidth: 1, borderColor: "#dbe5e0", backgroundColor: "white", borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#172b25" },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 16 }, card: { padding: 16, borderRadius: 18, borderWidth: 1, borderColor: "#e0e9e4", backgroundColor: "#fafcfb", marginTop: 12 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#172b25" }, row: { flexDirection: "row", gap: 12 }, flex: { flex: 1, minWidth: 0 }, remove: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }, removeText: { fontSize: 12, color: "#c53c45" }, muted: { color: "#a4afaa" },
  primary: { backgroundColor: "#0abb8a", borderRadius: 16, minHeight: 52, padding: 14, alignItems: "center", justifyContent: "center", marginTop: 18 }, primaryText: { fontSize: 15, fontWeight: "700", color: "#fff", textAlign: "center" }, secondary: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 10 }, link: { fontWeight: "600", color: "#07865e", fontSize: 14 },
  summary: { backgroundColor: "#ecfaf4", padding: 18, borderRadius: 18, marginTop: 12 }, total: { fontSize: 25, fontWeight: "800", color: "#075e43", marginTop: 8 }, success: { color: "#07865e", fontWeight: "700", fontSize: 15, marginBottom: 16 }, error: { color: "#b42332", fontSize: 13, lineHeight: 20, marginTop: 12 }, disabled: { opacity: 0.5 },
});
