import { after, before, beforeEach, it } from "node:test";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { asAlice, asBob, asCarol, createEnv, F1, seedFamilies } from "./setup.mjs";

let env;
before(async () => { env = await createEnv(); });
beforeEach(async () => { await env.clearFirestore(); await seedFamilies(env); });
after(async () => { await env?.cleanup(); });
function create(db, overrides = {}, itemOverrides = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, "shoppingLists/week"), { name: "Weekly groceries", familyId: F1, createdBy: "alice", createdAt: serverTimestamp(), ...overrides });
  batch.set(doc(db, "shoppingLists/week/items/rice"), { name: "Rice", quantity: 2, unitPriceCents: 35050, purchased: false, position: 0, ...itemOverrides });
  return batch.commit();
}
it("creates a list and items atomically and shares reads with the family", async () => {
  await assertSucceeds(create(asAlice(env)));
  await assertSucceeds(getDoc(doc(asBob(env), "shoppingLists/week/items/rice")));
  await assertFails(getDoc(doc(asCarol(env), "shoppingLists/week")));
});
it("rejects another family's writes and impersonating a creator", async () => {
  await assertFails(create(asCarol(env)));
  await assertFails(create(asBob(env)));
});
it("rejects invalid item values and rolls back the whole list", async () => {
  await assertFails(create(asAlice(env), {}, { quantity: 0 }));
  const missing = await getDoc(doc(asAlice(env), "shoppingLists/week" )).catch(() => null);
  if (missing?.exists()) throw new Error("Invalid item left a partial shopping list.");
  await assertFails(create(asAlice(env), {}, { unitPriceCents: -1 }));
});
