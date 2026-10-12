import { readFile } from "node:fs/promises";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getMetadata, deleteObject } from "firebase/storage";

let env;
before(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("Run npm run test:firebase; these tests require the local emulator.");
  env = await initializeTestEnvironment({ projectId: "demo-famtrack", firestore: { rules: await readFile(new URL("../../firestore.rules", import.meta.url), "utf8") }, storage: { rules: await readFile(new URL("../../storage.rules", import.meta.url), "utf8") } });
});
beforeEach(async () => env.clearFirestore());
after(async () => { if (env) await env.cleanup(); });
const userDb = (uid, email = `${uid}@example.test`) => env.authenticatedContext(uid, { email }).firestore();
async function register(db, uid, familyId, email = `${uid}@example.test`) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), { name: uid, email, familyId, createdAt: serverTimestamp() });
  batch.set(doc(db, "families", familyId), { name: "Test family", ownerId: uid, createdAt: serverTimestamp() });
  batch.set(doc(db, "families", familyId, "members", uid), { userId: uid, displayName: uid, relationship: "Other", role: "admin", status: "active", inviteEmail: null, canAddExpenses: true, joinedAt: serverTimestamp() });
  return batch.commit();
}
test("registration atomically creates own profile, family, and admin membership", async () => {
  const db = userDb("alice");
  await assertSucceeds(register(db, "alice", "family-a"));
  await assertSucceeds(getDoc(doc(db, "users", "alice")));
  await assertSucceeds(getDocs(collection(db, "families", "family-a", "members")));
});
test("signed-out users and other families cannot read private data", async () => {
  await register(userDb("alice"), "alice", "family-a");
  await register(userDb("bob"), "bob", "family-b");
  for (const db of [env.unauthenticatedContext().firestore(), userDb("bob")]) {
    await assertFails(getDoc(doc(db, "users", "alice")));
    await assertFails(getDoc(doc(db, "families", "family-a")));
    await assertFails(getDocs(collection(db, "families", "family-a", "members")));
  }
});
test("forged profiles cannot claim an existing family or another user", async () => {
  await register(userDb("alice"), "alice", "family-a");
  const db = userDb("bob");
  await assertFails(setDoc(doc(db, "users", "bob"), { name: "Bob", email: "bob@example.test", familyId: "family-a", createdAt: serverTimestamp() }));
  await assertFails(register(db, "someone-else", "family-b"));
});
test("admin invitations allow only the matching email to join", async () => {
  const admin = userDb("alice");
  await register(admin, "alice", "family-a");
  const invitation = writeBatch(admin);
  invitation.set(doc(admin, "families", "family-a", "members", "invite-bob"), { userId: null, displayName: "Bob", relationship: "Other", role: "member", status: "pending", inviteEmail: "bob@example.test", canAddExpenses: true, joinedAt: null });
  invitation.set(doc(admin, "familyInvitations", "bob@example.test"), { familyId: "family-a", memberId: "invite-bob", email: "bob@example.test", invitedBy: "alice", status: "pending", createdAt: serverTimestamp() });
  await assertSucceeds(invitation.commit());
  const outsider = userDb("mallory");
  await assertFails(getDoc(doc(outsider, "familyInvitations", "bob@example.test")));
  const db = userDb("bob");
  const join = writeBatch(db);
  join.set(doc(db, "users", "bob"), { name: "Bob", email: "bob@example.test", familyId: "family-a", createdAt: serverTimestamp() });
  join.update(doc(db, "families", "family-a", "members", "invite-bob"), { userId: "bob", status: "active", joinedAt: serverTimestamp() });
  join.update(doc(db, "familyInvitations", "bob@example.test"), { status: "accepted" });
  await assertSucceeds(join.commit());
  await assertSucceeds(getDoc(doc(db, "families", "family-a")));
  await assertFails(updateDoc(doc(db, "families", "family-a"), { ownerId: "bob" }));
});

test("own profile edits synchronize the member name without changing ownership", async () => {
  const db = userDb("alice");
  await register(db, "alice", "family-a");
  const batch = writeBatch(db);
  batch.update(doc(db, "users", "alice"), { name: "Alice Updated", phone: "+94712345678", photoPath: "profilePhotos/alice/new-photo" });
  batch.update(doc(db, "families", "family-a", "members", "alice"), { displayName: "Alice Updated" });
  await assertSucceeds(batch.commit());
  await assertFails(updateDoc(doc(db, "users", "alice"), { familyId: "family-b" }));
  await assertFails(updateDoc(doc(db, "users", "alice"), { email: "fake@example.test" }));
  await assertFails(updateDoc(doc(db, "users", "alice"), { photoPath: "profilePhotos/bob/photo" }));
  await assertFails(updateDoc(doc(db, "users", "alice"), { phone: "invalid" }));
  await assertFails(updateDoc(doc(db, "families", "family-a", "members", "alice"), { role: "member" }));
  await assertFails(updateDoc(doc(db, "families", "family-a", "members", "alice"), { displayName: "Not the profile name" }));
  await assertFails(updateDoc(doc(userDb("bob"), "users", "alice"), { name: "Forged" }));
});

test("photos can only be uploaded by their owner with an allowed image type and size", async () => {
  const owner = env.authenticatedContext("alice", { email: "alice@example.test" }).storage();
  const other = env.authenticatedContext("bob", { email: "bob@example.test" }).storage();
  await assertSucceeds(uploadBytes(ref(owner, "profilePhotos/alice/photo"), new Uint8Array([1, 2, 3]), { contentType: "image/jpeg" }));
  await assertSucceeds(getMetadata(ref(owner, "profilePhotos/alice/photo")));
  await assertFails(uploadBytes(ref(other, "profilePhotos/alice/forged"), new Uint8Array([1]), { contentType: "image/jpeg" }));
  await assertFails(uploadBytes(ref(owner, "profilePhotos/alice/text"), new Uint8Array([1]), { contentType: "text/plain" }));
  await assertFails(uploadBytes(ref(owner, "profilePhotos/alice/large"), new Uint8Array(5 * 1024 * 1024 + 1), { contentType: "image/jpeg" }));
  await assertFails(getMetadata(ref(other, "profilePhotos/alice/photo")));
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "alice"), { familyId: "family-a" });
    await setDoc(doc(db, "users", "bob"), { familyId: "family-a" });
    await setDoc(doc(db, "users", "charlie"), { familyId: "family-b" });
  });
  await assertSucceeds(getMetadata(ref(other, "profilePhotos/alice/photo")));
  await assertFails(getMetadata(ref(env.authenticatedContext("charlie").storage(), "profilePhotos/alice/photo")));
  await assertFails(getMetadata(ref(env.unauthenticatedContext().storage(), "profilePhotos/alice/photo")));
  await assertFails(deleteObject(ref(other, "profilePhotos/alice/photo")));
  await assertSucceeds(deleteObject(ref(owner, "profilePhotos/alice/photo")));
});
