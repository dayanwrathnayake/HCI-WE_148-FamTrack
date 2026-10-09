import type { Timestamp } from "firebase/firestore";

// Firestore document shapes. Ids live in the document path (and are added by the
// services when reading), so they are not repeated inside the stored data.
// Values that can be derived (spent, left, per-member totals, category amounts,
// "on track") are intentionally NOT stored here.

export type Role = "admin" | "member";
export type Relationship = "Parent" | "Child" | "Other";
export type MemberStatus = "pending" | "active";
export type InvitationStatus = "pending" | "accepted";
export type BudgetPeriod = "weekly" | "monthly" | "yearly";
/** The budget categories a family can allocate a share to. "other" is implicit and never stored. */
export type CategoryId =
  | "food"
  | "groceries"
  | "shopping"
  | "transport"
  | "bills"
  | "health"
  | "entertainment";
/** Whole-number percentages of the monthly budget. Their sum is at most 100; the rest is "Other". */
export type CategoryShares = Partial<Record<CategoryId, number>>;
export type ExpenseStatus = "Shared" | "Pending";

/** users/{uid} — the document id is the Firebase Auth uid. */
export type UserProfile = {
  name: string;
  email: string; // stored lowercased
  familyId: string | null;
  createdAt: Timestamp;
  phone?: string;
  photoPath?: string;
};

/** families/{familyId} */
export type Family = {
  name: string;
  ownerId: string; // uid
  createdAt: Timestamp;
};

/**
 * families/{familyId}/members/{memberId}
 * A member can exist before they have an account (userId is null while invited).
 */
export type FamilyMember = {
  userId: string | null;
  displayName: string;
  relationship: Relationship;
  role: Role;
  status: MemberStatus;
  inviteEmail: string | null; // lowercased; null for the family creator
  canAddExpenses: boolean;
  joinedAt: Timestamp | null; // set when the member becomes active
};

/**
 * familyInvitations/{normalizedEmail} — keyed by the lowercased email so
 * registration can look it up with a single read. One pending invite per email.
 */
export type FamilyInvitation = {
  familyId: string;
  memberId: string;
  email: string;
  invitedBy: string; // uid
  status: InvitationStatus;
  createdAt: Timestamp;
};

/** budgets/{budgetId} */
export type Budget = {
  familyId: string;
  name: string;
  amount: number; // integer rupees
  period: BudgetPeriod;
  startDate: Timestamp;
  alertPercentage: number; // 0-100
  membersCanAddExpenses: boolean;
  /**
   * Percentage share per category (rupee allocations and "Other" are derived, never stored).
   * Budgets saved before categories existed have no map; the services read them as the defaults.
   */
  categories: CategoryShares;
  createdBy: string; // uid
};

/** An expense's category: any budget category, or "other" (which is never given a budget share). */
export type ExpenseCategoryId = CategoryId | "other";

/**
 * expenses/{expenseId}. The month's budget is always `{familyId}_{monthKey}`, so no budgetId is
 * stored. Spent totals, per-category and per-member totals and each person's equal share are
 * derived from these records, never stored.
 */
export type Expense = {
  familyId: string;
  monthKey: string; // "YYYY-MM", derived from `date`
  categoryId: ExpenseCategoryId;
  title: string; // the category's label unless a screen has a title field
  amount: number; // integer rupees
  paidBy: string; // memberId (members may not have an account)
  splitAmong: string[]; // memberIds, shared equally
  status: ExpenseStatus; // "Pending" until the admin approves; only "Shared" counts as spending
  note: string; // free text, may be empty
  date: Timestamp; // the chosen day at 00:00:00 UTC
  createdBy: string; // uid
  createdByMember: string; // memberId of the creator
  createdAt: Timestamp;
  receiptUri?: string | null;
};


/** A document read back from Firestore, with its id attached. */
export type WithId<T> = T & { id: string };
