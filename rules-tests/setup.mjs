// Shared setup for the Firestore rules tests. They run against the Firestore EMULATOR only
// (see `npm run test:rules`); nothing here can reach the real Firebase project.
//
// Seed data (written with rules disabled):
//   family F1  owner alice (admin member id "alice"), active member bob (member id "bobMember")
//   family F2  owner carol (admin member id "carol")
//   erin       signed in but has no profile (a brand-new registrant)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

export const F1 = "family1";
export const F2 = "family2";

export const DAY_MS = 24 * 60 * 60 * 1000;

const rulesPath = fileURLToPath(new URL("../firestore.rules", import.meta.url));

export async function createEnv() {
  return initializeTestEnvironment({
    projectId: "demo-famtrack",
    firestore: { rules: readFileSync(rulesPath, "utf8") },
  });
}

/** A Firestore handle signed in as `uid` with the given email. */
export function as(env, uid, email) {
  return env.authenticatedContext(uid, { email }).firestore();
}

export const asAlice = (env) => as(env, "alice", "alice@example.com");
export const asBob = (env) => as(env, "bob", "bob@example.com");
export const asCarol = (env) => as(env, "carol", "carol@example.com");
export const asErin = (env) => as(env, "erin", "erin@example.com");
export const asAnon = (env) => env.unauthenticatedContext().firestore();

/** Writes documents with the rules switched off. `docs` is a list of [path, data]. */
export async function seed(env, docs) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [path, data] of docs) await setDoc(doc(db, path), data);
  });
}

/** Reads a document's data with the rules switched off (null when it does not exist). */
export async function readDoc(env, path) {
  let data = null;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore(), path));
    data = snap.exists() ? snap.data() : null;
  });
  return data;
}

export const ts = (date) => Timestamp.fromDate(date);
export const daysAgo = (n) => ts(new Date(Date.now() - n * DAY_MS));

export function memberData(overrides = {}) {
  return {
    userId: null,
    displayName: "Member",
    relationship: "Other",
    role: "member",
    status: "pending",
    inviteEmail: null,
    canAddExpenses: true,
    joinedAt: null,
    ...overrides,
  };
}

/** Both families, their users and members. */
export async function seedFamilies(env) {
  await seed(env, [
    [`families/${F1}`, { name: "Alice Family", ownerId: "alice", createdAt: daysAgo(100) }],
    [`families/${F2}`, { name: "Carol Family", ownerId: "carol", createdAt: daysAgo(100) }],
    ["users/alice", { name: "Alice", email: "alice@example.com", familyId: F1, createdAt: daysAgo(100) }],
    ["users/bob", { name: "Bob", email: "bob@example.com", familyId: F1, createdAt: daysAgo(90) }],
    ["users/carol", { name: "Carol", email: "carol@example.com", familyId: F2, createdAt: daysAgo(100) }],
    [
      `families/${F1}/members/alice`,
      memberData({ userId: "alice", displayName: "Alice", role: "admin", status: "active", joinedAt: daysAgo(100) }),
    ],
    [
      `families/${F1}/members/bobMember`,
      memberData({
        userId: "bob",
        displayName: "Bob",
        status: "active",
        inviteEmail: "bob@example.com",
        joinedAt: daysAgo(90),
      }),
    ],
    [
      `families/${F2}/members/carol`,
      memberData({ userId: "carol", displayName: "Carol", role: "admin", status: "active", joinedAt: daysAgo(100) }),
    ],
  ]);
}

// ---------- months (UTC, like the rules) ----------

export const monthKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

/** The UTC month `offset` months from now, e.g. offset 0 = this month. */
export function monthStart(offset = 0) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
}

export const budgetId = (familyId, offset = 0) => `${familyId}_${monthKey(monthStart(offset))}`;

export function budgetData(familyId, offset = 0, overrides = {}) {
  return {
    familyId,
    name: "Family Budget",
    amount: 100000,
    period: "monthly",
    startDate: ts(monthStart(offset)),
    alertPercentage: 80,
    membersCanAddExpenses: true,
    categories: { food: 30, transport: 20 },
    createdBy: familyId === F1 ? "alice" : "carol",
    ...overrides,
  };
}

/** Today at 00:00:00 UTC. */
export function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
