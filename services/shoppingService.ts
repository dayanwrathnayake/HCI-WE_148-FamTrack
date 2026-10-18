import AsyncStorage from "@react-native-async-storage/async-storage";

export type ShoppingItemDraft = { name: string; quantity: string; price: string };
export type ShoppingList = ReturnType<typeof prepareShoppingList> & { id: string; familyId: string; createdAt: string };

export async function getShoppingLists(familyId: string): Promise<ShoppingList[]> {
  const stored = await AsyncStorage.getItem(`famtrack:demo-shopping:${familyId}`);
  const lists = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(lists)) throw new Error("Could not read local shopping lists.");
  return lists;
}

export async function updateShoppingList(familyId: string, list: ShoppingList) {
  const prepared = prepareShoppingList(list.name, list.items.map(item => ({ name: item.name, quantity: String(item.quantity), price: (item.unitPriceCents / 100).toFixed(2) })));
  const lists = await getShoppingLists(familyId);
  if (!lists.some(row => row.id === list.id)) throw new Error("This list no longer exists.");
  const updated = { ...list, ...prepared, items: prepared.items.map((item, index) => ({ ...item, purchased: list.items[index].purchased })) };
  await AsyncStorage.setItem(`famtrack:demo-shopping:${familyId}`, JSON.stringify(lists.map(row => row.id === list.id ? updated : row)));
}

export async function deleteShoppingList(familyId: string, id: string) {
  const lists = await getShoppingLists(familyId);
  await AsyncStorage.setItem(`famtrack:demo-shopping:${familyId}`, JSON.stringify(lists.filter(row => row.id !== id)));
}

export function prepareShoppingList(name: string, items: ShoppingItemDraft[]) {
  if (!name.trim() || name.trim().length > 80) throw new Error("Enter a list name (up to 80 characters).");
  if (!items.length || items.length > 20) throw new Error("Add between 1 and 20 items.");
  const prepared = items.map((item, index) => {
    if (!item.name.trim() || item.name.trim().length > 80) throw new Error(`Enter a name for item ${index + 1}.`);
    if (!/^\d+$/.test(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 999) throw new Error(`Item ${index + 1}: quantity must be 1–999.`);
    if (!/^\d+(\.\d{1,2})?$/.test(item.price)) throw new Error(`Item ${index + 1}: enter a unit price, or 0 if unknown.`);
    const [whole, fraction = ""] = item.price.split(".");
    const unitPriceCents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
    if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents > 100000000) throw new Error(`Item ${index + 1}: price is too large.`);
    return { name: item.name.trim(), quantity: Number(item.quantity), unitPriceCents, purchased: false };
  });
  return { name: name.trim(), items: prepared, totalCents: prepared.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0) };
}

export async function createShoppingList(familyId: string, name: string, items: ShoppingItemDraft[]) {
  const prepared = prepareShoppingList(name, items);
  const key = `famtrack:demo-shopping:${familyId}`;
  const stored = await AsyncStorage.getItem(key);
  const lists = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(lists)) throw new Error("Could not read your local shopping lists.");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(key, JSON.stringify([...lists, { id, familyId, ...prepared, createdAt: new Date().toISOString() }]));
  return id;
}
