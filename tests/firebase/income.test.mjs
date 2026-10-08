import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, beforeEach, after, test } from "node:test";
import { createRequire } from "node:module";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";

let env;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Run the demo emulator tests, not a live Firebase project.");
  env = await initializeTestEnvironment({ projectId: "demo-famtrack", firestore: { rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8") } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const [uid, familyId, role] of [["alice", "family-a", "member"], ["bob", "family-a", "admin"], ["charlie", "family-b", "admin"]]) {
      await setDoc(doc(db, "users", uid), { name: uid, email: `${uid}@gmail.com`, familyId });
      await setDoc(doc(db, "families", familyId, "members", uid), { userId: uid, status: "active", role, displayName: uid });
    }
  });
});
after(async () => { if (env) await env.cleanup(); });
const userDb = uid => env.authenticatedContext(uid, { email: `${uid}@gmail.com` }).firestore();
const data = () => ({ familyId: "family-a", createdBy: "alice", memberId: "alice", title: "Salary", amountCents: 150025, source: "Salary", date: Timestamp.fromDate(new Date("2026-10-08T00:00:00Z")), monthKey: "2026-10", status: "Received", familyBudget: true, version: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const incomeQuery = (db, family = "family-a", month = "2026-10") => query(collection(db, "incomes"), where("familyId", "==", family), where("monthKey", "==", month));

test("income persists and is readable by its family, not other families or signed-out users", async () => {
  const alice = userDb("alice");
  await assertSucceeds(setDoc(doc(alice, "incomes", "salary"), data()));
  assert.equal((await getDoc(doc(userDb("alice"), "incomes", "salary"))).data().amountCents, 150025);
  assert.equal((await assertSucceeds(getDocs(incomeQuery(userDb("bob"))))).size, 1);
  await assertFails(getDocs(incomeQuery(userDb("charlie"))));
  await assertFails(getDoc(doc(userDb("charlie"), "incomes", "salary")));
  await assertFails(getDocs(incomeQuery(env.unauthenticatedContext().firestore())));
  await assertFails(getDocs(collection(alice, "incomes")));
});
test("only the creator can edit/delete income, including when another member is admin", async () => {
  const alice = userDb("alice");
  await setDoc(doc(alice, "incomes", "salary"), data());
  const changes = { title: "Updated salary", amountCents: 200050, version: 2, updatedAt: serverTimestamp() };
  for (const uid of ["bob", "charlie"]) {
    await assertFails(updateDoc(doc(userDb(uid), "incomes", "salary"), changes));
    await assertFails(deleteDoc(doc(userDb(uid), "incomes", "salary")));
  }
  await assertSucceeds(updateDoc(doc(alice, "incomes", "salary"), changes));
  assert.equal((await getDoc(doc(alice, "incomes", "salary"))).data().amountCents, 200050);
  await assertFails(updateDoc(doc(alice, "incomes", "salary"), { title: "Stale edit", version: 2, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(alice, "incomes", "salary"), { createdBy: "bob", version: 3, updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(alice, "incomes", "salary")));
  assert.equal((await getDocs(incomeQuery(alice))).size, 0);
});
test("forged membership, invalid amounts/dates, and extra fields are rejected", async () => {
  const db = userDb("alice");
  const invalid = [{ createdBy: "bob" }, { memberId: "bob" }, { familyId: "family-b" }, { amountCents: 0 }, { amountCents: -1 }, { amountCents: 100.5 }, { amountCents: 10000000001 }, { source: "Fake" }, { monthKey: "2026-09" }, { date: Timestamp.fromDate(new Date("2026-10-08T12:00:00Z")) }, { version: 2 }, { title: "" }, { injected: true }];
  for (const [index, overrides] of invalid.entries()) await assertFails(setDoc(doc(db, "incomes", `invalid-${index}`), { ...data(), ...overrides }));
});
test("editing a date moves the income between month histories", async () => {
  const db = userDb("alice");
  await setDoc(doc(db, "incomes", "salary"), data());
  await assertSucceeds(updateDoc(doc(db, "incomes", "salary"), { date: Timestamp.fromDate(new Date("2026-09-30T00:00:00Z")), monthKey: "2026-09", version: 2, updatedAt: serverTimestamp() }));
  assert.equal((await getDocs(incomeQuery(db))).size, 0);
  assert.equal((await getDocs(incomeQuery(userDb("bob"), "family-a", "2026-09"))).size, 1);
});
test("another family member receives live income changes", async () => {
  let unsubscribe;
  let timer;
  try {
    const observed = new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Income listener did not receive the saved record")), 10000);
      unsubscribe = onSnapshot(incomeQuery(userDb("bob")), snapshot => { if (snapshot.docs.some(item => item.id === "live")) resolve(snapshot.docs.find(item => item.id === "live").data().amountCents); }, reject);
    });
    await setDoc(doc(userDb("alice"), "incomes", "live"), data());
    assert.equal(await observed, 150025);
  } finally { clearTimeout(timer); if (unsubscribe) unsubscribe(); }
});
test("amount parsing preserves cents and rejects invalid precision; dates do not shift with timezone", async () => {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const source = await readFile(new URL("../../utils/income.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { parseIncomeAmount, parseIncomeDate } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  assert.equal(parseIncomeAmount("1,500.25"), 150025);
  assert.equal(parseIncomeAmount("0.01"), 1);
  for (const amount of ["0", "-1", "1.234", "NaN", "", "1e3"]) assert.throws(() => parseIncomeAmount(amount));
  assert.equal(parseIncomeDate("2026-10-08").toISOString(), "2026-10-08T00:00:00.000Z");
  assert.throws(() => parseIncomeDate("2026-02-30"));
});
