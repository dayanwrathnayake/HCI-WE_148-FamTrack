import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";
import { deleteApp, initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, EmailAuthProvider, getAuth, getIdToken, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";

let app;
let auth;
let functions;
before(() => {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error("Run npm run test:firebase; never run this test against live Firebase.");
  app = initializeApp({ apiKey: "demo-key", projectId: "demo-famtrack" }, "auth-tests");
  auth = getAuth(app);
  connectAuthEmulator(auth, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`, { disableWarnings: true });
  functions = getFunctions(app);
  connectFunctionsEmulator(functions, "127.0.0.1", 15001);
});

test("password-confirmed Gmail changes update Auth and profile without verification", async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("This test requires demo emulators.");
  const serverRequire = createRequire(new URL("../../functions/package.json", import.meta.url));
  const { initializeApp: initializeAdmin, deleteApp: deleteAdmin } = serverRequire("firebase-admin/app");
  const { getAuth: getAdminAuth } = serverRequire("firebase-admin/auth");
  const { getFirestore } = serverRequire("firebase-admin/firestore");
  const admin = initializeAdmin({ projectId: "demo-famtrack" }, "email-test-admin");
  const db = getFirestore(admin);
  try {
    const email = `original-${Date.now()}@gmail.com`;
    const password = "Test-only-password-42";
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await db.doc(`users/${user.uid}`).set({ name: "Verify Test", email, familyId: null });
    const sync = httpsCallable(functions, "syncAccountEmail");
    const change = httpsCallable(functions, "changeAccountEmail");
    await assert.rejects(reauthenticateWithCredential(user, EmailAuthProvider.credential(email, "wrong-password")));
    await assert.rejects(change({ email: "wrong@yahoo.com" }), error => error.code === "functions/invalid-argument");
    const takenEmail = `taken-${Date.now()}@gmail.com`;
    await getAdminAuth(admin).createUser({ email: takenEmail, password });
    await assert.rejects(change({ email: takenEmail }), error => error.code === "functions/already-exists");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, password));
    await getIdToken(user, true);
    const confirmedEmail = `changed-${Date.now()}@gmail.com`;
    assert.equal((await change({ email: confirmedEmail })).data.email, confirmedEmail);
    assert.equal((await getAdminAuth(admin).getUser(user.uid)).emailVerified, false);
    assert.equal((await db.doc(`users/${user.uid}`).get()).data().email, confirmedEmail);
    await signOut(auth);
    await assert.rejects(signInWithEmailAndPassword(auth, email, password));
    await signInWithEmailAndPassword(auth, confirmedEmail, password);
    const result = await sync({ email: "forged@example.test" });
    assert.equal(result.data.email, confirmedEmail);
    assert.equal((await db.doc(`users/${user.uid}`).get()).data().email, confirmedEmail);
    await signOut(auth);
    await assert.rejects(sync(), error => error.code === "functions/unauthenticated");
    await assert.rejects(change({ email: "another@gmail.com" }), error => error.code === "functions/unauthenticated");
  } finally {
    await db.terminate();
    await deleteAdmin(admin);
  }
});
after(async () => { if (app) await deleteApp(app); });
test("email/password registration, logout, login, and reset use the emulator", async () => {
  const email = `account-${Date.now()}@example.test`;
  const password = "Test-only-password-42";
  const registered = await createUserWithEmailAndPassword(auth, email, password);
  const uid = registered.user.uid;
  assert.equal(auth.currentUser.uid, uid);
  await signOut(auth);
  assert.equal(auth.currentUser, null);
  await assert.rejects(signInWithEmailAndPassword(auth, email, "wrong-password"));
  assert.equal(auth.currentUser, null);
  const loggedIn = await signInWithEmailAndPassword(auth, email, password);
  assert.equal(loggedIn.user.uid, uid);
  await sendPasswordResetEmail(auth, email);
  await signOut(auth);
  assert.equal(auth.currentUser, null);
});
