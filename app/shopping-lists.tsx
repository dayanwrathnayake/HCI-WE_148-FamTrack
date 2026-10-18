import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IncomeHeader } from "../components/IncomeHeader";
import { useFamily } from "../context/FamilyContext";
import { deleteShoppingList, getShoppingLists, prepareShoppingList, updateShoppingList, type ShoppingItemDraft, type ShoppingList } from "../services/shoppingService";

const money = (cents: number) => `Rs ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type Editor = { type: "rename"; value: string } | { type: "item"; index: number; draft: ShoppingItemDraft };

export default function ShoppingListsScreen() {
  const { family } = useFamily();
  const scope = family?.id ?? "demo";
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [editorError, setEditorError] = useState("");
  const [confirm, setConfirm] = useState<{ index?: number } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError("");
    getShoppingLists(scope).then(data => { if (active) setLists(data); }).catch(() => { if (active) setError("Could not load local lists. Leave this page and try again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scope]));
  const list = lists.find(row => row.id === selected);
  const mutate = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await action(); setLists(await getShoppingLists(scope)); return true; }
    catch { setError("Could not save the change on this device. Please try again."); return false; }
    finally { locked.current = false; setBusy(false); }
  };
  const saveEditor = async () => {
    if (!editor || !list) return;
    let next = list;
    try {
      if (editor.type === "rename") {
        if (!editor.value.trim() || editor.value.trim().length > 80) throw new Error("Enter a list name (up to 80 characters).");
        next = { ...list, name: editor.value.trim() };
      } else {
        const item = prepareShoppingList("Item", [editor.draft]).items[0];
        const items = [...list.items];
        if (editor.index < 0) { if (items.length >= 20) throw new Error("A list can contain up to 20 items."); items.push(item); }
        else items[editor.index] = { ...item, purchased: items[editor.index].purchased };
        next = { ...list, items };
      }
      setEditorError("");
      if (await mutate(() => updateShoppingList(scope, next))) setEditor(null);
      else setEditorError("Could not save on this device. Please try again.");
    } catch (cause) { setEditorError(cause instanceof Error ? cause.message : "Check the entered values."); }
  };
  const remove = async () => {
    if (!list || !confirm) return;
    const success = confirm.index === undefined
      ? await mutate(() => deleteShoppingList(scope, list.id))
      : await mutate(() => updateShoppingList(scope, { ...list, items: list.items.filter((_, index) => index !== confirm.index) }));
    if (success) { if (confirm.index === undefined) setSelected(null); setConfirm(null); }
  };
  const editItem = (index: number) => {
    if (!list) return;
    const item = list.items[index]; setEditorError("");
    setEditor({ type: "item", index, draft: item ? { name: item.name, quantity: String(item.quantity), price: (item.unitPriceCents / 100).toFixed(2) } : { name: "", quantity: "1", price: "" } });
  };
  return <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
    <IncomeHeader title="Shopping Lists" onBack={() => { if (!busy) { if (selected) setSelected(null); else router.replace("/(tabs)/home"); } }} />
    <ScrollView contentContainerStyle={s.content}>
      {loading ? <ActivityIndicator color="#0abb8a" style={s.loading} /> : list ? <>
        <View style={s.summary}><Text style={s.title}>{list.name}</Text><Text style={s.hint}>{list.items.filter(item => item.purchased).length} of {list.items.length} purchased</Text><Text style={s.total}>{money(list.totalCents)}</Text><Text style={s.hint}>Estimated total · {money(list.items.filter(item => !item.purchased).reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0))} remaining</Text></View>
        <View style={s.row}><Pressable disabled={busy} style={s.secondary} onPress={() => { setEditorError(""); setEditor({ type: "rename", value: list.name }); }}><Text style={s.link}>Rename list</Text></Pressable><Pressable disabled={busy} style={s.secondary} onPress={() => setConfirm({})}><Text style={s.danger}>Delete list</Text></Pressable></View>
        {list.items.map((item, index) => <View key={index} style={s.card}>
          <View style={s.row}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.purchased, disabled: busy }} accessibilityLabel={`${item.name}, purchased`} disabled={busy} style={[s.checkbox, item.purchased && s.checked]} onPress={() => void mutate(() => updateShoppingList(scope, { ...list, items: list.items.map((row, position) => position === index ? { ...row, purchased: !row.purchased } : row) }))}><Text style={s.checkText}>{item.purchased ? "✓" : ""}</Text></Pressable><View style={s.flex}><Text style={[s.itemName, item.purchased && s.strike]}>{item.name}</Text><Text style={s.hint}>{item.quantity} × {money(item.unitPriceCents)}</Text></View><Text style={s.amount}>{money(item.quantity * item.unitPriceCents)}</Text></View>
          <View style={s.row}><Pressable disabled={busy} style={s.secondary} onPress={() => editItem(index)}><Text style={s.link}>Edit</Text></Pressable><Pressable disabled={busy || list.items.length === 1} style={s.secondary} onPress={() => setConfirm({ index })}><Text style={[s.danger, list.items.length === 1 && s.muted]}>Remove</Text></Pressable></View>
        </View>)}
        {list.items.length === 1 && <Text style={s.hint}>Keep at least one item, or delete the whole list.</Text>}
        <Pressable disabled={busy || list.items.length >= 20} style={s.primary} onPress={() => editItem(-1)}><Text style={s.primaryText}>{list.items.length >= 20 ? "20-item limit reached" : "+ Add item"}</Text></Pressable>
      </> : <>
        <Text style={s.title}>Plan your family purchases</Text>
        {!lists.length && <View style={s.summary}><Text style={s.title}>Your first shop starts here</Text><Text style={s.hint}>Create a list, estimate your costs, and check off items as you shop.</Text></View>}
        {lists.map(row => <Pressable key={row.id} accessibilityRole="button" disabled={busy} style={s.card} onPress={() => setSelected(row.id)}><Text style={s.itemName}>{row.name}</Text><Text style={s.hint}>{row.items.filter(item => item.purchased).length}/{row.items.length} purchased · {new Date(row.createdAt).toLocaleDateString()}</Text><Text style={s.total}>{money(row.totalCents)}</Text><Text style={s.link}>Open list ›</Text></Pressable>)}
        <Pressable style={s.primary} onPress={() => router.push("/create-shopping-list")}><Text style={s.primaryText}>+ New Shopping List</Text></Pressable>
      </>}
      {!!error && <Text accessibilityLiveRegion="polite" style={s.error}>{error}</Text>}
      {busy && <ActivityIndicator color="#0abb8a" />}
    </ScrollView>
    <Modal visible={!!editor} transparent animationType="fade" onRequestClose={() => { if (!busy) setEditor(null); }}>
      <View style={s.overlay}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalScroll}><View style={s.dialog} accessibilityViewIsModal>
        <Text style={s.title}>{editor?.type === "rename" ? "Rename list" : editor?.type === "item" && editor.index >= 0 ? "Edit item" : "Add item"}</Text>
        {editor?.type === "rename" ? <><Text style={s.label}>List name</Text><TextInput accessibilityLabel="List name" editable={!busy} style={s.input} value={editor.value} maxLength={80} onChangeText={value => setEditor({ ...editor, value })} /></> : editor?.type === "item" ? ([['name', 'Item name'], ['quantity', 'Quantity'], ['price', 'Unit price (Rs)']] as const).map(([field, label]) => <View key={field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!busy} style={s.input} value={editor.draft[field]} keyboardType={field === "name" ? "default" : field === "quantity" ? "number-pad" : "decimal-pad"} maxLength={field === "name" ? 80 : field === "quantity" ? 3 : 12} onChangeText={value => setEditor({ ...editor, draft: { ...editor.draft, [field]: value } })} /></View>) : null}
        {!!editorError && <Text accessibilityLiveRegion="polite" style={s.error}>{editorError}</Text>}
        <Pressable disabled={busy} style={s.primary} onPress={saveEditor}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.primaryText}>Save changes</Text>}</Pressable><Pressable disabled={busy} style={s.secondary} onPress={() => setEditor(null)}><Text style={s.link}>Cancel</Text></Pressable>
      </View></ScrollView></View>
    </Modal>
    <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => { if (!busy) setConfirm(null); }}><View style={s.overlay}><View style={s.dialog} accessibilityViewIsModal><Text style={s.title}>{confirm?.index === undefined ? "Delete this list?" : "Remove this item?"}</Text><Text style={s.hint}>This removes it from this device and cannot be undone.</Text>{!!error && <Text style={s.error}>{error}</Text>}<Pressable disabled={busy} style={[s.primary, s.deleteButton]} onPress={remove}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.primaryText}>Delete</Text>}</Pressable><Pressable disabled={busy} style={s.secondary} onPress={() => setConfirm(null)}><Text style={s.link}>Cancel</Text></Pressable></View></View></Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "white" }, content: { padding: 20, paddingBottom: 36, width: "100%", maxWidth: 600, alignSelf: "center" }, hint: { fontSize: 12, lineHeight: 19, color: "#687c73", marginVertical: 5 }, title: { fontSize: 21, fontWeight: "700", color: "#172b25", marginVertical: 12 }, summary: { backgroundColor: "#ecfaf4", padding: 18, borderRadius: 20, marginTop: 14 }, total: { fontSize: 24, fontWeight: "800", color: "#075e43", marginVertical: 10 },
  card: { padding: 16, borderWidth: 1, borderColor: "#dce8e1", borderRadius: 18, marginTop: 14 }, row: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }, flex: { flex: 1, minWidth: 80 }, itemName: { fontSize: 16, fontWeight: "600", color: "#172b25" }, amount: { fontSize: 14, fontWeight: "600", color: "#075e43" }, strike: { textDecorationLine: "line-through", color: "#83948b" }, checkbox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#0abb8a", alignItems: "center", justifyContent: "center" }, checked: { backgroundColor: "#0abb8a" }, checkText: { color: "white", fontWeight: "700", fontSize: 22 },
  primary: { backgroundColor: "#0abb8a", minHeight: 50, padding: 14, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 18 }, primaryText: { color: "white", fontWeight: "700", fontSize: 15 }, secondary: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }, link: { color: "#07865e", fontWeight: "600", fontSize: 14 }, danger: { color: "#c43242", fontSize: 14 }, muted: { color: "#a4afaa" }, error: { color: "#b42332", marginVertical: 12, lineHeight: 20 }, loading: { margin: 40 },
  overlay: { flex: 1, backgroundColor: "rgba(16,24,42,0.4)", justifyContent: "center", padding: 22 }, modalScroll: { flexGrow: 1, justifyContent: "center" }, dialog: { width: "100%", maxWidth: 440, alignSelf: "center", backgroundColor: "white", padding: 22, borderRadius: 24 }, label: { fontSize: 12, color: "#687c73", marginTop: 14, marginBottom: 8 }, input: { minHeight: 48, minWidth: 0, borderWidth: 1, borderColor: "#dce8e1", borderRadius: 12, padding: 12, fontSize: 15, color: "#172b25" }, deleteButton: { backgroundColor: "#d83b48" },
});
