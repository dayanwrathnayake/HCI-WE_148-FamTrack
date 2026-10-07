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
export type ExpenseStatus = "Shared" | "Pending";

/** users/{uid} — the document id is the Firebase Auth uid. */
export type UserProfile = {
  name: string;
  email: string; // stored lowercased
  familyId: string | null;
  createdAt: Timestamp;
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
  createdBy: string; // uid
};

/** categoryBudgets/{id} — the rupee allocation is derived: amount * percentage / 100. */
export type CategoryBudget = {
  budgetId: string;
  familyId: string;
  categoryId: string;
  percentage: number; // 0-100
};

/** expenses/{expenseId} */
export type Expense = {
  familyId: string;
  budgetId: string;
  categoryId: string;
  title: string;
  amount: number; // integer rupees
  paidBy: string; // memberId (members may not have an account)
  splitAmong: string[]; // memberIds
  status: ExpenseStatus;
  createdBy: string; // uid
  date: Timestamp;
  createdAt: Timestamp;
};

/** A document read back from Firestore, with its id attached. */
export type WithId<T> = T & { id: string };
