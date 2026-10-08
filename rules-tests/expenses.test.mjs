import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

import {
  asAlice,
  asBob,
  asCarol,
  asErin,
  budgetData,
  budgetId,
  createEnv,
  DAY_MS,
  F1,
  monthKey,
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
beforeEach(async () => {
  await env.clearFirestore();
  await seedFamilies(env);
});

const EXP = "expenses/e1";
const key = () => monthKey(todayUtc());

/** A valid expense created by the admin (alice). Override fields per test. */
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
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

/** A valid Pending expense created by the member (bob). */
const bobExpense = (overrides = {}) =>
  expense({ createdBy: "bob", createdByMember: "bobMember", status: "Pending", paidBy: "bobMember", ...overrides });

const add = (db, data, id = "e1") => setDoc(doc(db, "expenses", id), data);

describe("who can add an expense", () => {
  it("the admin adds a Shared expense", async () => {
    await assertSucceeds(add(asAlice(env), expense()));
  });

  it("the admin cannot add a Pending expense", async () => {
    await assertFails(add(asAlice(env), expense({ status: "Pending" })));
  });

  it("a member adds a Pending expense", async () => {
    await assertSucceeds(add(asBob(env), bobExpense()));
  });

  it("a member cannot add a Shared expense", async () => {
    await assertFails(add(asBob(env), bobExpense({ status: "Shared" })));
  });

  it("a member with canAddExpenses off cannot add", async () => {
    await seed(env, [
      [
        `families/${F1}/members/bobMember`,
        { userId: "bob", displayName: "Bob", relationship: "Other", role: "member", status: "active", inviteEmail: null, canAddExpenses: false, joinedAt: ts(new Date()) },
      ],
    ]);
    await assertFails(add(asBob(env), bobExpense()));
  });

  it("a member cannot add when this month's budget turns member expenses off", async () => {
    await seed(env, [[`budgets/${budgetId(F1)}`, budgetData(F1, 0, { membersCanAddExpenses: false })]]);
    await assertFails(add(asBob(env), bobExpense()));
  });

  it("the admin can still add when members are switched off", async () => {
    await seed(env, [[`budgets/${budgetId(F1)}`, budgetData(F1, 0, { membersCanAddExpenses: false })]]);
    await assertSucceeds(add(asAlice(env), expense()));
  });

  it("a member can add when the budget allows it", async () => {
    await seed(env, [[`budgets/${budgetId(F1)}`, budgetData(F1, 0, { membersCanAddExpenses: true })]]);
    await assertSucceeds(add(asBob(env), bobExpense()));
  });

  it("a member can add when the month has no budget yet", async () => {
    await assertSucceeds(add(asBob(env), bobExpense()));
  });

  it("a stranger and another family's admin cannot add to this family", async () => {
    await assertFails(add(asErin(env), expense({ createdBy: "erin" })));
    await assertFails(add(asCarol(env), expense({ createdBy: "carol", createdByMember: "carol" })));
  });

  it("createdBy must be the signed-in user", async () => {
    await assertFails(add(asBob(env), bobExpense({ createdBy: "alice" })));
  });

  it("createdByMember must be the signed-in user's own member", async () => {
    // bob claiming to be the admin member to dodge the Pending rule
    await assertFails(add(asBob(env), expense({ createdBy: "bob", createdByMember: "alice" })));
  });

  it("a pending (not yet registered) member's id cannot be used as the creator", async () => {
    await seed(env, [
      [
        `families/${F1}/members/ghost`,
        { userId: null, displayName: "Ghost", relationship: "Other", role: "member", status: "pending", inviteEmail: "g@example.com", canAddExpenses: true, joinedAt: null },
      ],
    ]);
    await assertFails(add(asBob(env), bobExpense({ createdByMember: "ghost" })));
  });
});

describe("expense contents", () => {
  const db = () => asAlice(env);

  it("paidBy must be an active member of the same family", async () => {
    await assertFails(add(db(), expense({ paidBy: "carol" })));
    await assertFails(add(db(), expense({ paidBy: "nobody" })));
  });

  it("the date cannot be well in the future", async () => {
    await assertFails(add(db(), expense({ date: ts(new Date(todayUtc().getTime() + 3 * DAY_MS)) })));
  });

  it("the date must be in the current month", async () => {
    const old = new Date(todayUtc().getTime() - 70 * DAY_MS);
    await assertFails(add(db(), expense({ date: ts(old), monthKey: monthKey(old) })));
  });

  it("monthKey must match the date", async () => {
    await assertFails(add(db(), expense({ monthKey: "2020-01" })));
  });

  it("the date must be midnight UTC", async () => {
    await assertFails(add(db(), expense({ date: ts(new Date(todayUtc().getTime() + 3600 * 1000)) })));
  });

  it("amount must be a whole number from 1 to 100,000,000", async () => {
    await assertFails(add(db(), expense({ amount: 0 })));
    await assertFails(add(db(), expense({ amount: -5 })));
    await assertFails(add(db(), expense({ amount: 12.5 })));
    await assertFails(add(db(), expense({ amount: 100000001 })));
    await assertSucceeds(add(db(), expense({ amount: 100000000 })));
  });

  it("category must be a known id", async () => {
    await assertFails(add(db(), expense({ categoryId: "gambling" })));
    await assertSucceeds(add(db(), expense({ categoryId: "other" })));
  });

  it("title, note and split are bounded", async () => {
    await assertFails(add(db(), expense({ title: "" })));
    await assertFails(add(db(), expense({ note: "x".repeat(501) })));
    await assertFails(add(db(), expense({ splitAmong: [] })));
    await assertFails(add(db(), expense({ splitAmong: Array.from({ length: 21 }, (_, i) => `m${i}`) })));
  });

  it("unknown or missing fields are rejected", async () => {
    await assertFails(add(db(), expense({ approvedBy: "alice" })));
    const data = expense();
    delete data.note;
    await assertFails(add(db(), data));
  });

  it("createdAt must be the server time", async () => {
    await assertFails(add(db(), expense({ createdAt: ts(new Date(Date.now() + 10 * DAY_MS)) })));
  });
});

describe("reading expenses", () => {
  beforeEach(() => seed(env, [[EXP, { ...expense(), createdAt: ts(new Date()) }]]));

  it("a family member can read one", async () => {
    await assertSucceeds(getDoc(doc(asBob(env), EXP)));
  });

  it("another family and strangers cannot", async () => {
    await assertFails(getDoc(doc(asCarol(env), EXP)));
    await assertFails(getDoc(doc(asErin(env), EXP)));
  });

  it("a member can list their own family's month, filtered by family", async () => {
    const q = query(collection(asBob(env), "expenses"), where("familyId", "==", F1), where("monthKey", "==", key()));
    await assertSucceeds(getDocs(q));
  });

  it("listing another family's expenses is denied", async () => {
    const q = query(collection(asCarol(env), "expenses"), where("familyId", "==", F1));
    await assertFails(getDocs(q));
  });

  it("an unfiltered list is denied", async () => {
    await assertFails(getDocs(collection(asBob(env), "expenses")));
  });
});

describe("approving and deleting", () => {
  beforeEach(() => seed(env, [[EXP, { ...bobExpense(), createdAt: ts(new Date()) }]]));

  it("the admin approves a Pending expense", async () => {
    await assertSucceeds(updateDoc(doc(asAlice(env), EXP), { status: "Shared" }));
  });

  it("a member cannot approve, not even their own", async () => {
    await assertFails(updateDoc(doc(asBob(env), EXP), { status: "Shared" }));
  });

  it("another family's admin cannot approve", async () => {
    await assertFails(updateDoc(doc(asCarol(env), EXP), { status: "Shared" }));
  });

  it("approval cannot be combined with any other change", async () => {
    // Editing content is its own permission (see expense-actions.test.mjs); status never rides along.
    const db = asAlice(env);
    await assertFails(updateDoc(doc(db, EXP), { status: "Shared", amount: 999999 }));
    await assertFails(updateDoc(doc(db, EXP), { status: "Shared", paidBy: "alice" }));
  });

  it("an expense cannot go back to Pending", async () => {
    await seed(env, [[EXP, { ...expense(), createdAt: ts(new Date()) }]]);
    await assertFails(updateDoc(doc(asAlice(env), EXP), { status: "Pending" }));
  });

  it("strangers and other families cannot delete an expense", async () => {
    await assertFails(deleteDoc(doc(asErin(env), EXP)));
    await assertFails(deleteDoc(doc(asCarol(env), EXP)));
    await assertFails(deleteDoc(doc(env.unauthenticatedContext().firestore(), EXP)));
  });
});
