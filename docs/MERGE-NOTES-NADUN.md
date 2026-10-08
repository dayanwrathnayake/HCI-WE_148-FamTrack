# Merging Nadun's branch: known conflicts

**Status:** not merged. Written so the merge can be done carefully later. Based on a dry run (`git merge-tree`, which
changes nothing) of `origin/Feature/Nadun/Shared-Family-Budget` (tip `932712d`) into `Feature/Backend-Auth-Budget`.
Both branches started from `3bb8814`.

**Decision:** until the team agrees otherwise, the Firestore-backed `ExpenseContext` and `expenseService` on the backend
branch (monthly `expenses` documents with approval, edit and delete) are the source of truth for expenses, and the
`FamilyContext`/`familyService` pair is the source of truth for family and members. Nadun's equivalents should be
rebuilt on top of them, not the other way round.

## Files that conflict

| File | What conflicts | Suggested resolution |
| --- | --- | --- |
| `firestore.rules` | His rules are older and much looser (see the next section). | Keep ours. Port only what is still missing: rules for `savingGoals` and `recurringBills`, tightened the same way (family isolation, admin/member roles, field checks), and tests for them in `rules-tests/`. |
| `services/expenseService.ts` | Both sides added this file with different content. His has `createExpense` and `subscribeToFamilyExpenses`; ours has `addExpense`, `subscribeToExpenses`, `approveExpense`, `updateExpense`, `deleteExpense`. | Keep ours. |
| `context/ExpenseContext.tsx` | His exposes `historyGroups`, `totalSpent`, `loading`, `addExpense(...)`; ours exposes `status`, `expenses`, `totals`, `permission`, `addExpense`, `approveExpense`, `updateExpense`, `deleteExpense`, `getActions`. | Keep ours. Anything of his that reads `historyGroups` or `totalSpent` must be moved to `expenses` and `totals`. |
| `app/add-expense.tsx`, `app/expense-history.tsx`, `components/MemberSelector.tsx` | Both sides changed these screens. Ours read the real contexts; his changed member selection and the history list for his context shape. | Start from ours, then re-apply only his genuine UI fixes. |
| `services/familyService.ts` | He added `removeFamilyMember`; ours added invitation expiry and renewal. | Combine: keep both. Add a delete rule for it that is **narrow** (admin only, never the admin themself) and tests. |
| `context/BillsContext.tsx` | Both changed it (his rewrites it onto Firestore). | Take his Bills work, then check it still reads family data from `FamilyContext`. |
| `package.json`, `package-lock.json` | Both added dependencies. | Merge `package.json` by hand, then regenerate the lock file with `npm install`. Do not hand-edit the lock file. |

## Problems in his rules that must not reach production

These are in his branch's `firestore.rules` as of `932712d`:

1. `allow delete: if signedIn();` on **family members** and on **family invitations**. Any signed-in user, in any
   family, could delete any member or invitation.
2. `expenses`: `allow update, delete` for **any family member** on **any** expense. There is no Pending/approval
   check, no field check and no month check, so a member could change or remove the admin's expenses or approve their
   own.
3. `expenses`: `create` only checks the family and `createdBy`. Amounts, dates, status and payers are not validated.
4. Looser `budgets` rules than ours (`create` and `update` only need `signedIn()` plus family checks in places).

Ours already enforce: owner-only budget writes (current month only), Pending-only creation by members, approval by the
admin only, edits and deletes limited as in `SECURITY.md`, and no member or invitation deletes at all.

## Same collection, different documents

Both models write to the `expenses` collection but with **different shapes**: his stores a `budgetId` (defaulting to
`"default"`) and has no `monthKey`, `createdByMember` or `createdAt`; ours has no `budgetId` and requires `monthKey`.
Documents written by one app version fail the other's validation, and his documents would never appear in our monthly
listener (it filters by `monthKey`). Do not run both versions against the same Firebase project with real data. If
his documents already exist, delete the test data or migrate it before the merge.

## Suggested merge order

1. Agree with Nadun that our expense and family backends win.
2. Merge his branch into a temporary branch (not into `Feature/Backend-Auth-Budget`).
3. Resolve each file above as suggested. Run `npm install`, `npx tsc --noEmit`, `npx expo lint` and
   `npm run test:rules`.
4. Add emulator tests for every rule taken from his branch (`savingGoals`, `recurringBills`, member removal).
5. Publish `firestore.rules` only after all tests pass, then manually test the Shared Expenses, Add Expense,
   Expense History, Manage Group, Bills and Savings screens.
