import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { BillCategory, BillStatus } from "../constants/bills";

export type RecurringBillDoc = {
  id?: string;
  familyId: string;
  title: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  isAutoPay: boolean;
  status: BillStatus;
  assignedMemberId: string | null;
  paidByText?: string | null;
  iconEmoji: string;
  iconBg: string;
  createdBy: string;
  createdAt: Timestamp | null;
};

export type CreateRecurringBillInput = {
  familyId: string;
  title: string;
  category: BillCategory;
  amount: number;
  dueDate: string;
  isAutoPay: boolean;
  assignedMemberId?: string | null;
  iconEmoji: string;
  iconBg: string;
  createdBy: string;
};

export async function createRecurringBill(
  input: CreateRecurringBillInput,
): Promise<string> {
  const billData = {
    familyId: input.familyId,
    title: input.title.trim(),
    category: input.category,
    amount: Math.max(0, Math.round(Number(input.amount))),
    dueDate: input.dueDate.trim(),
    isAutoPay: Boolean(input.isAutoPay),
    status: (input.isAutoPay ? "AUTO-PAY" : "UNPAID") as BillStatus,
    assignedMemberId: input.assignedMemberId || null,
    paidByText: null,
    iconEmoji: input.iconEmoji || "📄",
    iconBg: input.iconBg || "#e2e8f0",
    createdBy: input.createdBy,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "recurringBills"), billData);
  return docRef.id;
}

export function subscribeToFamilyBills(
  familyId: string,
  onUpdate: (bills: (RecurringBillDoc & { id: string })[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const q = query(
    collection(db, "recurringBills"),
    where("familyId", "==", familyId),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const bills = snapshot.docs.map((d) => {
        const data = d.data({
          serverTimestamps: "estimate",
        }) as RecurringBillDoc;
        return {
          id: d.id,
          ...data,
        };
      });

      bills.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.createdAt?.toMillis?.() ?? 0;
        return timeB - timeA;
      });

      onUpdate(bills);
    },
    (error) => {
      console.warn("[billsService] listener error:", error);
      onError?.(error);
    },
  );
}

export async function updateBillStatus(
  billId: string,
  status: BillStatus,
  paidByText?: string | null,
): Promise<void> {
  const billRef = doc(db, "recurringBills", billId);
  await updateDoc(billRef, {
    status,
    paidByText: paidByText || null,
  });
}
