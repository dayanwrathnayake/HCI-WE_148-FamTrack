import { collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { INCOME_SOURCES, type IncomeEntry, type IncomeInput } from "../constants/income";
import { parseIncomeAmount, parseIncomeDate } from "../utils/income";

type IncomeDocument = {
  familyId: string; createdBy: string; memberId: string; title: string; amountCents: number;
  source: IncomeInput["source"]; date: Timestamp; monthKey: string; status: IncomeInput["status"];
  familyBudget: boolean; version: number; createdAt: Timestamp; updatedAt: Timestamp;
};
const fromDocument = (id: string, data: IncomeDocument): IncomeEntry => ({ id, familyId: data.familyId, createdBy: data.createdBy, memberId: data.memberId, title: data.title, amount: data.amountCents / 100, source: data.source, date: data.date.toDate().toISOString().slice(0, 10), status: data.status, familyBudget: data.familyBudget, version: data.version, createdAtMs: data.createdAt?.toMillis() ?? 0 });
function editableFields(input: IncomeInput) {
  const title = input.title.trim();
  if (!title || title.length > 100) throw new Error("Enter a title of 1–100 characters.");
  if (!INCOME_SOURCES.includes(input.source)) throw new Error("Select an income source.");
  if (input.status !== "Received" && input.status !== "Expected") throw new Error("Select a valid income status.");
  return { title, amountCents: parseIncomeAmount(input.amountText), source: input.source, date: Timestamp.fromDate(parseIncomeDate(input.date)), monthKey: input.date.slice(0, 7), status: input.status, familyBudget: input.familyBudget };
}
export type IncomeEvent = { status: "ready"; entries: IncomeEntry[] } | { status: "error"; error: unknown };
export function subscribeToIncome(familyId: string, monthKey: string, receive: (event: IncomeEvent) => void) {
  return onSnapshot(query(collection(db, "incomes"), where("familyId", "==", familyId), where("monthKey", "==", monthKey)), { includeMetadataChanges: true }, snapshot => {
    if (snapshot.empty && snapshot.metadata.fromCache) return;
    try { receive({ status: "ready", entries: snapshot.docs.map(item => fromDocument(item.id, item.data({ serverTimestamps: "estimate" }) as IncomeDocument)) }); }
    catch (error) { receive({ status: "error", error }); }
  }, error => receive({ status: "error", error }));
}
export async function getIncome(id: string, familyId: string): Promise<IncomeEntry | null> {
  const snapshot = await getDoc(doc(db, "incomes", id));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as IncomeDocument;
  if (data.familyId !== familyId) throw new Error("This income belongs to another family.");
  return fromDocument(snapshot.id, data);
}
export async function createIncome(familyId: string, memberId: string, input: IncomeInput) {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in again.");
  const fields = editableFields(input);
  const record = doc(collection(db, "incomes"));
  await setDoc(record, { ...fields, familyId, memberId, createdBy: user.uid, version: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return record.id;
}
export async function updateIncomeRecord(entry: IncomeEntry, input: IncomeInput) {
  const fields = editableFields(input);
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== entry.createdBy) throw new Error("You can only edit your own income.");
  await runTransaction(db, async transaction => {
    const record = doc(db, "incomes", entry.id);
    const snapshot = await transaction.get(record);
    if (!snapshot.exists()) throw new Error("This income was deleted. Return to history.");
    const current = snapshot.data() as IncomeDocument;
    if (current.createdBy !== uid || current.familyId !== entry.familyId) throw new Error("You can only edit your own income.");
    if (current.version !== entry.version) throw new Error("This income changed. Return to history and reopen it before editing.");
    transaction.update(record, { ...fields, version: current.version + 1, updatedAt: serverTimestamp() });
  });
}
export async function deleteIncomeRecord(entry: IncomeEntry) {
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== entry.createdBy) throw new Error("You can only delete your own income.");
  await runTransaction(db, async transaction => {
    const record = doc(db, "incomes", entry.id);
    const snapshot = await transaction.get(record);
    if (!snapshot.exists()) return;
    const current = snapshot.data() as IncomeDocument;
    if (current.createdBy !== uid || current.familyId !== entry.familyId) throw new Error("You can only delete your own income.");
    if (current.version !== entry.version) throw new Error("This income changed. Close this dialog and try again from history.");
    transaction.delete(record);
  });
}
export function incomeErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "permission-denied") return "Income access was denied. Check your family membership and the deployed income rules.";
  if (code === "unavailable") return "Check your connection and try again.";
  if (code === "failed-precondition") return "Income could not load. Check the Firebase database setup.";
  return error instanceof Error && !code ? error.message : "Could not complete the income request. Please try again.";
}
