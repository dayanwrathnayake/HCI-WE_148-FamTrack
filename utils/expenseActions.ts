// Which actions the signed-in user gets on an existing expense. Pure so the UI and the service agree
// with each other; the Firestore rules (firestore.rules, "expenses") are what actually enforce it.
//
//   - Only the CURRENT month can be changed; earlier months are read-only history.
//   - Admin: any expense. Pending -> Approve, Edit, Decline. Shared -> Edit, Delete.
//   - Member: only their OWN expense while it is Pending -> Edit (if they may still add expenses)
//     and Withdraw. Never anything on a Shared expense or on someone else's.

export type ExpenseAction = "approve" | "edit" | "delete";

type ActionStatus = "Shared" | "Pending";

export function getExpenseActions(args: {
  isAdmin: boolean;
  /** The expense was created by the signed-in user. */
  isOwnExpense: boolean;
  status: ActionStatus;
  isCurrentMonth: boolean;
  /** The signed-in member's own "can add expenses" permission. */
  canAddExpenses: boolean;
}): ExpenseAction[] {
  const { isAdmin, isOwnExpense, status, isCurrentMonth, canAddExpenses } = args;
  if (!isCurrentMonth) return [];

  if (isAdmin) {
    return status === "Pending" ? ["approve", "edit", "delete"] : ["edit", "delete"];
  }
  if (isOwnExpense && status === "Pending") {
    return canAddExpenses ? ["edit", "delete"] : ["delete"];
  }
  return [];
}

/** What the delete action is called: the admin declines a Pending expense, a member withdraws theirs. */
export function getDeleteLabel(args: { isAdmin: boolean; status: ActionStatus }): string {
  if (args.status === "Pending") return args.isAdmin ? "Decline expense" : "Withdraw expense";
  return "Delete expense";
}
