const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

initializeApp();
exports.syncAccountEmail = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in again.");
  const user = await getAuth().getUser(request.auth.uid);
  if (!user.email) throw new HttpsError("failed-precondition", "Your account has no login email.");
  const db = getFirestore();
  const profileRef = db.doc(`users/${user.uid}`);
  await db.runTransaction(async transaction => {
    const profile = await transaction.get(profileRef);
    if (!profile.exists) throw new HttpsError("not-found", "Your profile could not be found.");
    transaction.update(profileRef, { email: user.email.toLowerCase() });
  });
  return { email: user.email.toLowerCase() };
});

// Prototype policy: no email delivery/verification; require a recent password sign-in.
exports.changeAccountEmail = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Please sign in again.");
  const authTime = Number(request.auth.token.auth_time);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authTime) || now - authTime > 300 || authTime > now + 60
      || request.auth.token.firebase?.sign_in_provider !== "password") {
    throw new HttpsError("failed-precondition", "Confirm your current password again.");
  }
  const email = typeof request.data?.email === "string" ? request.data.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@gmail\.com$/.test(email)) throw new HttpsError("invalid-argument", "Use an @gmail.com address.");
  const adminAuth = getAuth();
  const user = await adminAuth.getUser(request.auth.uid);
  const profileRef = getFirestore().doc(`users/${user.uid}`);
  if (!(await profileRef.get()).exists) throw new HttpsError("not-found", "Your profile could not be found.");
  try {
    await adminAuth.updateUser(user.uid, { email, emailVerified: false });
  } catch (error) {
    if (error.code === "auth/email-already-exists") throw new HttpsError("already-exists", "That email is already in use.");
    throw new HttpsError("internal", "Could not change your login email.");
  }
  try {
    await profileRef.update({ email });
  } catch {
    // Auth and Firestore cannot share a transaction. Restore Auth if the profile write fails.
    try { await adminAuth.updateUser(user.uid, { email: user.email, emailVerified: user.emailVerified }); }
    catch { throw new HttpsError("internal", "Email setup is incomplete. Sign in with the new email to synchronize your profile."); }
    throw new HttpsError("internal", "Could not save your email. Please try again.");
  }
  return { email };
});
