import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import {
  asAlice,
  asBob,
  asCarol,
  asErin,
  budgetData,
  budgetId,
  createEnv,
  F1,
  F2,
  monthStart,
  seed,
  seedFamilies,
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

const ref = (db, familyId, offset = 0) => doc(db, "budgets", budgetId(familyId, offset));
const create = (db, offset = 0, overrides = {}, familyId = F1) =>
  setDoc(ref(db, familyId, offset), budgetData(familyId, offset, overrides));

describe("reading budgets", () => {
  beforeEach(() => seed(env, [[`budgets/${budgetId(F1)}`, budgetData(F1)]]));

  it("a family member can read it", async () => {
    await assertSucceeds(getDoc(ref(asBob(env), F1)));
  });

  it("a member can read a month that has no budget yet", async () => {
    await assertSucceeds(getDoc(ref(asBob(env), F1, -1)));
  });

  it("another family and signed-in strangers cannot", async () => {
    await assertFails(getDoc(ref(asCarol(env), F1)));
    await assertFails(getDoc(ref(asErin(env), F1)));
  });
});

describe("creating a budget", () => {
  it("the owner can create this month's budget", async () => {
    await assertSucceeds(create(asAlice(env)));
  });

  it("a plain member cannot", async () => {
    await assertFails(create(asBob(env)));
  });

  it("another family's owner cannot create one for this family", async () => {
    await assertFails(create(asCarol(env)));
  });

  // The rules also accept the month of "a day before" and "a day after" the server time (time
  // zones), so on the first or last day of a UTC month the neighbouring month is still allowed.
  // These tests use 2+ months away so they pass on any day of the month.
  it("a past month is rejected", async () => {
    await assertFails(create(asAlice(env), -2));
    await assertFails(create(asAlice(env), -6));
  });

  it("a future month is rejected", async () => {
    await assertFails(create(asAlice(env), 2));
    await assertFails(create(asAlice(env), 24));
  });

  it("the id must match the family and the start month", async () => {
    await assertFails(setDoc(doc(asAlice(env), "budgets", `${F1}_2020-01`), budgetData(F1)));
    await assertFails(setDoc(doc(asAlice(env), "budgets", "randomId"), budgetData(F1)));
  });

  it("the start date must be the 1st of the month at midnight UTC", async () => {
    const start = monthStart();
    const secondDay = new Date(start.getTime() + 24 * 3600 * 1000);
    const oneHourIn = new Date(start.getTime() + 3600 * 1000);
    await assertFails(create(asAlice(env), 0, { startDate: ts(secondDay) }));
    await assertFails(create(asAlice(env), 0, { startDate: ts(oneHourIn) }));
  });

  it("createdBy must be the signed-in user", async () => {
    await assertFails(create(asAlice(env), 0, { createdBy: "bob" }));
  });

  it("an extra field is rejected", async () => {
    await assertFails(create(asAlice(env), 0, { spent: 5 }));
  });

  it("a missing field is rejected", async () => {
    const data = budgetData(F1);
    delete data.alertPercentage;
    await assertFails(setDoc(ref(asAlice(env), F1), data));
  });

  it("amount, name, alert and period are validated", async () => {
    const db = asAlice(env);
    await assertFails(create(db, 0, { amount: 0 }));
    await assertFails(create(db, 0, { amount: 100000001 }));
    await assertFails(create(db, 0, { amount: 10.5 }));
    await assertFails(create(db, 0, { name: "" }));
    await assertFails(create(db, 0, { alertPercentage: 0 }));
    await assertFails(create(db, 0, { alertPercentage: 101 }));
    await assertFails(create(db, 0, { period: "weekly" }));
  });

  it("a budget with no categories yet is accepted", async () => {
    await assertSucceeds(create(asAlice(env), 0, { categories: {} }));
  });

  it("an out-of-range or overfull category split is rejected", async () => {
    const db = asAlice(env);
    await assertFails(create(db, 0, { categories: { food: 0 } }));
    await assertFails(create(db, 0, { categories: { food: 101 } }));
    await assertFails(create(db, 0, { categories: { food: 50.5 } }));
    await assertFails(create(db, 0, { categories: { food: 60, transport: 41 } }));
    await assertFails(create(db, 0, { categories: { other: 10 } }));
    await assertFails(create(db, 0, { categories: { madeup: 10 } }));
  });

  it("a split adding up to exactly 100 is accepted", async () => {
    await assertSucceeds(create(asAlice(env), 0, { categories: { food: 60, transport: 40 } }));
  });
});

describe("updating a budget", () => {
  beforeEach(() =>
    seed(env, [
      [`budgets/${budgetId(F1)}`, budgetData(F1)],
      [`budgets/${budgetId(F1, -2)}`, budgetData(F1, -2)],
    ]),
  );

  it("the owner can edit this month's budget", async () => {
    await assertSucceeds(updateDoc(ref(asAlice(env), F1), { amount: 150000, categories: { food: 50 } }));
  });

  it("a plain member cannot", async () => {
    await assertFails(updateDoc(ref(asBob(env), F1), { amount: 150000 }));
  });

  it("another family's owner cannot", async () => {
    await assertFails(updateDoc(ref(asCarol(env), F1), { amount: 150000 }));
  });

  it("an older month's budget is history and cannot be edited, even by the owner", async () => {
    await assertFails(updateDoc(ref(asAlice(env), F1, -2), { amount: 150000 }));
  });

  it("familyId, createdBy, period and startDate are frozen", async () => {
    const db = asAlice(env);
    await assertFails(updateDoc(ref(db, F1), { familyId: F2 }));
    await assertFails(updateDoc(ref(db, F1), { createdBy: "bob" }));
    await assertFails(updateDoc(ref(db, F1), { period: "weekly" }));
    await assertFails(updateDoc(ref(db, F1), { startDate: ts(monthStart(1)) }));
  });

  it("edited values are validated", async () => {
    const db = asAlice(env);
    await assertFails(updateDoc(ref(db, F1), { amount: 0 }));
    await assertFails(updateDoc(ref(db, F1), { categories: { food: 70, transport: 40 } }));
    await assertFails(updateDoc(ref(db, F1), { extra: true }));
  });
});

describe("budgets saved before categories existed", () => {
  it("gain their categories map on the next save (this month)", async () => {
    const legacy = budgetData(F1);
    delete legacy.categories;
    await seed(env, [[`budgets/${budgetId(F1)}`, legacy]]);
    // The validated shape needs categories, so an update that adds the map is the migration.
    await assertSucceeds(updateDoc(ref(asAlice(env), F1), { categories: { food: 25 } }));
  });
});

describe("deleting a budget", () => {
  beforeEach(() =>
    seed(env, [
      [`budgets/${budgetId(F1)}`, budgetData(F1)],
      [`budgets/${budgetId(F1, -2)}`, budgetData(F1, -2)],
      [`budgets/${budgetId(F2)}`, budgetData(F2)],
    ]),
  );

  it("the owner can delete this month's budget", async () => {
    await assertSucceeds(deleteDoc(ref(asAlice(env), F1)));
  });

  it("the budget is really gone, and the owner can set a new one for the month", async () => {
    await assertSucceeds(deleteDoc(ref(asAlice(env), F1)));
    const gone = await assertSucceeds(getDoc(ref(asAlice(env), F1)));
    if (gone.exists()) throw new Error("the budget should have been deleted");
    await assertSucceeds(create(asAlice(env)));
  });

  it("a plain member cannot delete it", async () => {
    await assertFails(deleteDoc(ref(asBob(env), F1)));
  });

  it("another family's owner and strangers cannot delete it", async () => {
    await assertFails(deleteDoc(ref(asCarol(env), F1)));
    await assertFails(deleteDoc(ref(asErin(env), F1)));
  });

  it("past months are read-only history: not even the owner can delete one", async () => {
    await assertFails(deleteDoc(ref(asAlice(env), F1, -2)));
  });

  it("deleting a budget never touches another family's budget", async () => {
    await assertSucceeds(deleteDoc(ref(asAlice(env), F1)));
    await assertSucceeds(getDoc(ref(asCarol(env), F2)));
  });

  it("the owner cannot delete a budget that does not exist", async () => {
    // Deleting a missing document has no data to check ownership against.
    await assertFails(deleteDoc(ref(asAlice(env), F1, 5)));
  });
});
