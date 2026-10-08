// Editing and deleting expenses (Phase 13). The matrix under test:
//   - CURRENT month only; earlier months are read-only history for everyone.
//   - Admin: edit or delete any expense of the family (deleting a Pending one is a decline).
//   - Member: edit or delete (withdraw) only their OWN expense while it is Pending; editing also needs
//     their own canAddExpenses; never anything on a Shared expense or on someone else's.
//   - An edit changes only category, title, amount, payer, split, note, date and monthKey. Status,
//     familyId, createdBy, createdByMember and createdAt are frozen; approval stays its own rule.

import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import {
  asAlice,
  asBob,
  asCarol,
  asErin,
  createEnv,
  DAY_MS,
  F1,
  memberData,
  monthKey,
  readDoc,
  seed,
  seedFamilies,
  todayUtc,
  ts,
} from "./setup.mjs";

let env;
before(async () => {
  env = await createEnv();
});
after(async () => {
  await env.cleanup();
});

const BOB_PENDING = "expenses/bobPending"; // created by bob (member), waiting for approval
const BOB_SHARED = "expenses/bobShared"; // created by bob, already approved
const ALICE_SHARED = "expenses/aliceShared"; // created by the admin
const DANA_PENDING = "expenses/danaPending"; // created by another member, dana
const OLD_SHARED = "expenses/oldShared"; // a previous month's expense
const OLD_BOB_PENDING = "expenses/oldBobPending";

const key = () => monthKey(todayUtc());

function expense(overrides = {}) {
  return {
    familyId: F1,
    monthKey: key(),
    categoryId: "food",
    title: "Food",
    amount: 1500,
    paidBy: "alice",
    splitAmong: ["alice", "bobMember"],
    status: "Shared",
    note: "",
    date: ts(todayUtc()),
    createdBy: "alice",
    createdByMember: "alice",
    createdAt: ts(new Date()),
    ...overrides,
  };
}

const bobMade = (overrides = {}) =>
  expense({ createdBy: "bob", createdByMember: "bobMember", paidBy: "bobMember", ...overrides });

const SEVENTY_DAYS_AGO = new Date(todayUtc().getTime() - 70 * DAY_MS);
const oldMonthKey = monthKey(SEVENTY_DAYS_AGO);

beforeEach(async () => {
  await env.clearFirestore();
  await seedFamilies(env);
  await seed(env, [
    // a third family member, dana, who is not the one testing
    ["users/dana", { name: "Dana", email: "dana@example.com", familyId: F1, createdAt: ts(new Date()) }],
    [
      `families/${F1}/members/danaMember`,
      memberData({ userId: "dana", displayName: "Dana", status: "active", inviteEmail: "dana@example.com", joinedAt: ts(new Date()) }),
    ],
    [BOB_PENDING, bobMade({ status: "Pending" })],
    [BOB_SHARED, bobMade({ status: "Shared" })],
    [ALICE_SHARED, expense()],
    [DANA_PENDING, expense({ createdBy: "dana", createdByMember: "danaMember", paidBy: "danaMember", status: "Pending" })],
    [OLD_SHARED, expense({ monthKey: oldMonthKey, date: ts(SEVENTY_DAYS_AGO) })],
    [
      OLD_BOB_PENDING,
      bobMade({ status: "Pending", monthKey: oldMonthKey, date: ts(SEVENTY_DAYS_AGO) }),
    ],
  ]);
});

const edit = (db, path, data) => updateDoc(doc(db, path), data);
const remove = (db, path) => deleteDoc(doc(db, path));

/** A different valid day in the current month: yesterday, unless that is another month (then today). */
function anotherDay() {
  const yesterday = new Date(todayUtc().getTime() - DAY_MS);
  return monthKey(yesterday) === key() ? yesterday : todayUtc();
}

describe("the admin editing an expense", () => {
  const alice = () => asAlice(env);

  it("can edit the amount of a Shared expense", async () => {
    await assertSucceeds(edit(alice(), BOB_SHARED, { amount: 2750 }));
  });

  it("can edit a Pending expense, which stays Pending", async () => {
    await assertSucceeds(edit(alice(), BOB_PENDING, { amount: 99, note: "corrected" }));
    const snap = await assertSucceeds(getDoc(doc(alice(), BOB_PENDING)));
    if (snap.data().status !== "Pending") throw new Error("an edit must not change the status");
  });

  it("can edit the category together with its title", async () => {
    await assertSucceeds(edit(alice(), ALICE_SHARED, { categoryId: "transport", title: "Transport" }));
  });

  it("can change the payer to another active member of the family", async () => {
    await assertSucceeds(edit(alice(), ALICE_SHARED, { paidBy: "bobMember" }));
  });

  it("can change the note and the date (inside the current month)", async () => {
    await assertSucceeds(edit(alice(), ALICE_SHARED, { note: "weekly shop" }));
    await assertSucceeds(edit(alice(), ALICE_SHARED, { date: ts(anotherDay()), monthKey: key() }));
  });

  it("can edit an expense that a member made", async () => {
    await assertSucceeds(edit(alice(), DANA_PENDING, { amount: 1 }));
  });

  it("cannot edit an expense of another family", async () => {
    await assertFails(edit(asCarol(env), BOB_SHARED, { amount: 5 }));
  });

  it("cannot edit a previous month's expense", async () => {
    await assertFails(edit(alice(), OLD_SHARED, { amount: 5 }));
    await assertFails(edit(alice(), OLD_BOB_PENDING, { amount: 5 }));
  });

  it("cannot edit an expense that does not exist", async () => {
    await assertFails(edit(alice(), "expenses/missing", { amount: 5 }));
  });
});

describe("edits are limited to the content fields", () => {
  const alice = () => asAlice(env);

  it("status cannot be changed by an edit (approval is its own action)", async () => {
    await assertFails(edit(alice(), ALICE_SHARED, { status: "Pending" }));
    await assertFails(edit(alice(), BOB_PENDING, { status: "Shared", amount: 5 }));
  });

  it("the split can be edited, but must still be 1 to 20 people", async () => {
    await assertSucceeds(edit(alice(), ALICE_SHARED, { splitAmong: ["alice"] })); // not split
    await assertSucceeds(edit(alice(), ALICE_SHARED, { splitAmong: ["alice", "bobMember"] }));
    await assertFails(edit(alice(), ALICE_SHARED, { splitAmong: [] }));
    await assertFails(edit(alice(), ALICE_SHARED, { splitAmong: Array.from({ length: 21 }, (_, i) => `m${i}`) }));
    await assertFails(edit(alice(), ALICE_SHARED, { splitAmong: "alice" }));
  });

  it("the split is changed together with other fields in one edit", async () => {
    await assertSucceeds(edit(alice(), ALICE_SHARED, { amount: 800, splitAmong: ["alice", "bobMember", "danaMember"] }));
  });

  it("ownership and creation fields are frozen", async () => {
    await assertFails(edit(alice(), BOB_SHARED, { familyId: "family2" }));
    await assertFails(edit(alice(), BOB_SHARED, { createdBy: "alice" }));
    await assertFails(edit(alice(), BOB_SHARED, { createdByMember: "alice" }));
    await assertFails(edit(alice(), BOB_SHARED, { createdAt: serverTimestamp() }));
  });

  it("unknown fields cannot be added", async () => {
    await assertFails(edit(alice(), ALICE_SHARED, { approvedBy: "alice" }));
  });

  it("the edited expense must still be valid", async () => {
    await assertFails(edit(alice(), ALICE_SHARED, { amount: 0 }));
    await assertFails(edit(alice(), ALICE_SHARED, { amount: -4 }));
    await assertFails(edit(alice(), ALICE_SHARED, { amount: 12.5 }));
    await assertFails(edit(alice(), ALICE_SHARED, { amount: 100000001 }));
    await assertFails(edit(alice(), ALICE_SHARED, { categoryId: "gambling" }));
    await assertFails(edit(alice(), ALICE_SHARED, { title: "" }));
    await assertFails(edit(alice(), ALICE_SHARED, { note: "x".repeat(501) }));
  });

  it("the payer must be an active member of the same family", async () => {
    await assertFails(edit(alice(), ALICE_SHARED, { paidBy: "carol" })); // the other family's admin
    await assertFails(edit(alice(), ALICE_SHARED, { paidBy: "nobody" }));
  });

  it("a pending (not yet joined) member cannot be the payer", async () => {
    await seed(env, [
      [
        `families/${F1}/members/ghost`,
        memberData({ displayName: "Ghost", inviteEmail: "ghost@example.com" }),
      ],
    ]);
    await assertFails(edit(alice(), ALICE_SHARED, { paidBy: "ghost" }));
  });

  it("the date must stay in the current month and not in the future", async () => {
    const future = new Date(todayUtc().getTime() + 3 * DAY_MS);
    await assertFails(edit(alice(), ALICE_SHARED, { date: ts(future), monthKey: monthKey(future) }));
    await assertFails(edit(alice(), ALICE_SHARED, { date: ts(SEVENTY_DAYS_AGO), monthKey: oldMonthKey }));
  });

  it("monthKey must match the date, and the date must be midnight UTC", async () => {
    await assertFails(edit(alice(), ALICE_SHARED, { monthKey: "2020-01" }));
    await assertFails(
      edit(alice(), ALICE_SHARED, { date: ts(new Date(todayUtc().getTime() + 3600 * 1000)) }),
    );
  });
});

describe("a member editing their own expense", () => {
  const bob = () => asBob(env);

  it("can edit their own Pending expense", async () => {
    await assertSucceeds(edit(bob(), BOB_PENDING, { amount: 400, note: "oops" }));
  });

  it("can change the category and the payer of their own Pending expense", async () => {
    await assertSucceeds(edit(bob(), BOB_PENDING, { categoryId: "health", title: "Health", paidBy: "alice" }));
  });

  it("cannot edit their own expense once it is Shared", async () => {
    await assertFails(edit(bob(), BOB_SHARED, { amount: 1 }));
  });

  it("cannot edit the admin's expense", async () => {
    await assertFails(edit(bob(), ALICE_SHARED, { amount: 1 }));
  });

  it("cannot edit another member's Pending expense", async () => {
    await assertFails(edit(bob(), DANA_PENDING, { amount: 1 }));
  });

  it("cannot approve their own expense by editing the status", async () => {
    await assertFails(edit(bob(), BOB_PENDING, { status: "Shared" }));
    await assertFails(edit(bob(), BOB_PENDING, { status: "Shared", amount: 1 }));
  });

  it("cannot reassign their expense to someone else", async () => {
    await assertFails(edit(bob(), BOB_PENDING, { createdBy: "alice", createdByMember: "alice" }));
  });

  it("can change the split of their own Pending expense, but not the frozen fields", async () => {
    await assertSucceeds(edit(bob(), BOB_PENDING, { splitAmong: ["bobMember"] })); // not split
    await assertFails(edit(bob(), BOB_PENDING, { familyId: "family2" }));
    await assertFails(edit(bob(), BOB_PENDING, { status: "Shared", splitAmong: ["bobMember"] }));
  });

  it("cannot change the split of a Shared expense or of someone else's", async () => {
    await assertFails(edit(bob(), BOB_SHARED, { splitAmong: ["bobMember"] }));
    await assertFails(edit(bob(), DANA_PENDING, { splitAmong: ["bobMember"] }));
  });

  it("cannot edit a previous month's Pending expense", async () => {
    await assertFails(edit(bob(), OLD_BOB_PENDING, { amount: 1 }));
  });

  it("cannot edit once their own can-add-expenses permission is off, but can still withdraw", async () => {
    await seed(env, [
      [
        `families/${F1}/members/bobMember`,
        memberData({ userId: "bob", displayName: "Bob", status: "active", inviteEmail: "bob@example.com", canAddExpenses: false, joinedAt: ts(new Date()) }),
      ],
    ]);
    await assertFails(edit(bob(), BOB_PENDING, { amount: 1 }));
    await assertSucceeds(remove(bob(), BOB_PENDING));
  });

  it("the edited expense must still be valid", async () => {
    await assertFails(edit(bob(), BOB_PENDING, { amount: 0 }));
    await assertFails(edit(bob(), BOB_PENDING, { paidBy: "carol" }));
  });
});

describe("outsiders editing", () => {
  it("a signed-in stranger, another family's admin and a signed-out user cannot edit anything", async () => {
    const anon = env.unauthenticatedContext().firestore();
    for (const path of [BOB_PENDING, BOB_SHARED, ALICE_SHARED]) {
      await assertFails(edit(asErin(env), path, { amount: 1 }));
      await assertFails(edit(asCarol(env), path, { amount: 1 }));
      await assertFails(edit(anon, path, { amount: 1 }));
    }
  });
});

describe("deleting an expense", () => {
  it("the admin can delete a Shared expense", async () => {
    await assertSucceeds(remove(asAlice(env), BOB_SHARED));
    await assertSucceeds(remove(asAlice(env), ALICE_SHARED));
  });

  it("the admin can decline (delete) a member's Pending expense", async () => {
    await assertSucceeds(remove(asAlice(env), BOB_PENDING));
    await assertSucceeds(remove(asAlice(env), DANA_PENDING));
  });

  it("a deleted expense is really gone", async () => {
    await assertSucceeds(remove(asAlice(env), BOB_PENDING));
    if ((await readDoc(env, BOB_PENDING)) !== null) throw new Error("the expense should have been deleted");
  });

  it("a member can withdraw (delete) their own Pending expense", async () => {
    await assertSucceeds(remove(asBob(env), BOB_PENDING));
  });

  it("a member cannot delete their own Shared expense", async () => {
    await assertFails(remove(asBob(env), BOB_SHARED));
  });

  it("a member cannot delete the admin's expense or another member's Pending expense", async () => {
    await assertFails(remove(asBob(env), ALICE_SHARED));
    await assertFails(remove(asBob(env), DANA_PENDING));
  });

  it("nobody can delete a previous month's expense", async () => {
    await assertFails(remove(asAlice(env), OLD_SHARED));
    await assertFails(remove(asAlice(env), OLD_BOB_PENDING));
    await assertFails(remove(asBob(env), OLD_BOB_PENDING));
  });

  it("another family's admin, strangers and signed-out users cannot delete", async () => {
    const anon = env.unauthenticatedContext().firestore();
    for (const path of [BOB_PENDING, BOB_SHARED, ALICE_SHARED]) {
      await assertFails(remove(asCarol(env), path));
      await assertFails(remove(asErin(env), path));
      await assertFails(remove(anon, path));
    }
  });

  it("a user who never joined the family cannot withdraw by claiming createdBy", async () => {
    // erin has no profile; even with the right createdBy she is not a member of the family.
    await seed(env, [["expenses/erinFake", expense({ createdBy: "erin", createdByMember: "bobMember", status: "Pending" })]]);
    await assertFails(remove(asErin(env), "expenses/erinFake"));
  });

  it("deleting does not touch the family's other expenses", async () => {
    await assertSucceeds(remove(asAlice(env), BOB_PENDING));
    if ((await readDoc(env, ALICE_SHARED)) === null) throw new Error("another expense was removed");
  });

  it("a member can no longer withdraw once the admin has approved it", async () => {
    await assertSucceeds(edit(asAlice(env), BOB_PENDING, { status: "Shared" }));
    await assertFails(remove(asBob(env), BOB_PENDING));
  });
});

describe("approval still works as before", () => {
  it("the admin can still approve a Pending expense", async () => {
    await assertSucceeds(edit(asAlice(env), BOB_PENDING, { status: "Shared" }));
  });

  it("a Shared expense cannot be sent back to Pending", async () => {
    await assertFails(edit(asAlice(env), BOB_SHARED, { status: "Pending" }));
  });

  it("re-saving a Shared expense as Shared changes nothing (a harmless no-op)", async () => {
    const before = await readDoc(env, BOB_SHARED);
    await assertSucceeds(edit(asAlice(env), BOB_SHARED, { status: "Shared" }));
    const after = await readDoc(env, BOB_SHARED);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("a no-op changed the expense");
  });

  it("a member still cannot approve", async () => {
    await assertFails(edit(asBob(env), BOB_PENDING, { status: "Shared" }));
  });
});
