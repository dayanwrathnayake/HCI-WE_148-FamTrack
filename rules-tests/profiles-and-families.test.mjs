import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { as, asAlice, asBob, asCarol, asErin, createEnv, daysAgo, F1, F2, memberData, seed, seedFamilies } from "./setup.mjs";

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

/** Registration without an invitation, as erin: profile + family + admin member in one batch. */
function erinRegisters(db, overrides = {}) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users/erin"), {
    name: "Erin",
    email: "erin@example.com",
    familyId: "erinFamily",
    createdAt: serverTimestamp(),
    ...overrides.user,
  });
  batch.set(doc(db, "families/erinFamily"), {
    name: "Erin's Family",
    ownerId: "erin",
    createdAt: serverTimestamp(),
    ...overrides.family,
  });
  batch.set(doc(db, "families/erinFamily/members/erin"), {
    userId: "erin",
    displayName: "Erin",
    relationship: "Other",
    role: "admin",
    status: "active",
    inviteEmail: null,
    canAddExpenses: true,
    joinedAt: serverTimestamp(),
    ...overrides.member,
  });
  return batch;
}

describe("everything is denied by default", () => {
  it("signed-out users cannot read or write anything", async () => {
    const db = as(env, "x", "x@example.com");
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/alice")));
    await assertFails(getDoc(doc(anon, `families/${F1}`)));
    await assertFails(setDoc(doc(anon, "users/x"), { name: "x" }));
    await assertFails(getDoc(doc(db, "somethingElse/x")));
  });
});

describe("user profiles", () => {
  it("a user reads their own profile only", async () => {
    await assertSucceeds(getDoc(doc(asAlice(env), "users/alice")));
    await assertFails(getDoc(doc(asAlice(env), "users/bob")));
  });

  it("profiles cannot be listed, edited or deleted", async () => {
    await assertFails(getDocs(collection(asAlice(env), "users")));
    await assertFails(updateDoc(doc(asAlice(env), "users/alice"), { name: "Changed" }));
    await assertFails(updateDoc(doc(asAlice(env), "users/alice"), { familyId: F2 }));
    await assertFails(deleteDoc(doc(asAlice(env), "users/alice")));
  });

  it("registration with a new family works", async () => {
    await assertSucceeds(erinRegisters(asErin(env)).commit());
  });

  it("a profile cannot be created for another uid", async () => {
    const batch = erinRegisters(asErin(env));
    await assertFails(
      setDoc(doc(asErin(env), "users/mallory"), {
        name: "M",
        email: "erin@example.com",
        familyId: "erinFamily",
        createdAt: serverTimestamp(),
      }),
    );
    await assertSucceeds(batch.commit());
  });

  it("a profile cannot point at an existing family the user does not own", async () => {
    await assertFails(
      setDoc(doc(asErin(env), "users/erin"), {
        name: "Erin",
        email: "erin@example.com",
        familyId: F1,
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("the profile email must be the account's email", async () => {
    await assertFails(erinRegisters(asErin(env), { user: { email: "someoneelse@example.com" } }).commit());
  });

  it("the profile name and shape are validated", async () => {
    await assertFails(erinRegisters(asErin(env), { user: { name: "" } }).commit());
    await assertFails(erinRegisters(asErin(env), { user: { isAdmin: true } }).commit());
  });

  it("a user that already has a profile cannot register a second family", async () => {
    const db = asAlice(env);
    const batch = writeBatch(db);
    batch.set(doc(db, "users/alice"), { name: "Alice", email: "alice@example.com", familyId: "second", createdAt: serverTimestamp() });
    batch.set(doc(db, "families/second"), { name: "Second", ownerId: "alice", createdAt: serverTimestamp() });
    batch.set(doc(db, "families/second/members/alice"), memberData({ userId: "alice", displayName: "Alice", role: "admin", status: "active", canAddExpenses: true, joinedAt: serverTimestamp() }));
    await assertFails(batch.commit());
  });
});

describe("families", () => {
  it("members read their own family; others cannot", async () => {
    await assertSucceeds(getDoc(doc(asAlice(env), `families/${F1}`)));
    await assertSucceeds(getDoc(doc(asBob(env), `families/${F1}`)));
    await assertFails(getDoc(doc(asCarol(env), `families/${F1}`)));
    await assertFails(getDoc(doc(asErin(env), `families/${F1}`)));
  });

  it("a family cannot be created on its own, only with the registering profile", async () => {
    await assertFails(
      setDoc(doc(asErin(env), "families/lonely"), { name: "Lonely", ownerId: "erin", createdAt: serverTimestamp() }),
    );
  });

  it("a family cannot be created owned by someone else", async () => {
    await assertFails(erinRegisters(asErin(env), { family: { ownerId: "alice" } }).commit());
  });

  it("the owner can rename the family; nothing else changes", async () => {
    const db = asAlice(env);
    await assertSucceeds(updateDoc(doc(db, `families/${F1}`), { name: "Renamed" }));
    await assertFails(updateDoc(doc(db, `families/${F1}`), { ownerId: "bob" }));
    await assertFails(updateDoc(doc(db, `families/${F1}`), { name: "" }));
  });

  it("a plain member cannot rename the family", async () => {
    await assertFails(updateDoc(doc(asBob(env), `families/${F1}`), { name: "Hijack" }));
  });

  it("a family cannot be deleted", async () => {
    await assertFails(deleteDoc(doc(asAlice(env), `families/${F1}`)));
  });
});

describe("family members", () => {
  const members = (family) => `families/${family}/members`;

  it("a family member can list the roster; others cannot", async () => {
    await assertSucceeds(getDocs(collection(asBob(env), members(F1))));
    await assertFails(getDocs(collection(asCarol(env), members(F1))));
    await assertFails(getDocs(collection(asErin(env), members(F1))));
  });

  it("a family member can read one member", async () => {
    await assertSucceeds(getDoc(doc(asBob(env), `${members(F1)}/alice`)));
  });

  it("outsiders cannot read an existing member of another family", async () => {
    await assertFails(getDoc(doc(asCarol(env), `${members(F1)}/alice`)));
  });

  it("outsiders cannot even probe a member that does not exist", async () => {
    // Used to be allowed by `resource == null`; registration now treats the denial as "no invite".
    await assertFails(getDoc(doc(asErin(env), `${members(F1)}/doesNotExist`)));
    await assertFails(getDoc(doc(asCarol(env), `${members(F1)}/doesNotExist`)));
  });

  it("a family member reading a missing member just gets an empty result", async () => {
    await assertSucceeds(getDoc(doc(asBob(env), `${members(F1)}/doesNotExist`)));
  });

  describe("a pending member", () => {
    beforeEach(() =>
      seed(env, [
        [
          `${members(F1)}/inv1`,
          memberData({ displayName: "Newbie", inviteEmail: "newbie@example.com" }),
        ],
      ]),
    );

    it("is readable by the invited email (registration needs it)", async () => {
      await assertSucceeds(getDoc(doc(as(env, "newbie", "newbie@example.com"), `${members(F1)}/inv1`)));
    });

    it("is not readable by a different email", async () => {
      await assertFails(getDoc(doc(as(env, "mallory", "mallory@example.com"), `${members(F1)}/inv1`)));
    });

    it("is readable by the invited email regardless of letter case", async () => {
      await assertSucceeds(getDoc(doc(as(env, "newbie", "Newbie@Example.com"), `${members(F1)}/inv1`)));
    });
  });

  describe("adding members", () => {
    const pending = (overrides = {}) =>
      memberData({ displayName: "New", inviteEmail: "new@example.com", ...overrides });

    it("the owner adds a pending member", async () => {
      await assertSucceeds(setDoc(doc(asAlice(env), `${members(F1)}/m9`), pending()));
    });

    it("a plain member cannot add members", async () => {
      await assertFails(setDoc(doc(asBob(env), `${members(F1)}/m9`), pending()));
    });

    it("the owner cannot add an admin, an active member or a member with a userId", async () => {
      const db = asAlice(env);
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ role: "admin" })));
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ status: "active" })));
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ userId: "bob" })));
    });

    it("inviteEmail must be lower-case and member fields are validated", async () => {
      const db = asAlice(env);
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ inviteEmail: "New@Example.com" })));
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ displayName: "" })));
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ relationship: "Boss" })));
      await assertFails(setDoc(doc(db, `${members(F1)}/m9`), pending({ extra: true })));
    });

    it("another family's owner cannot add members here", async () => {
      await assertFails(setDoc(doc(asCarol(env), `${members(F1)}/m9`), pending()));
    });
  });

  describe("changing members", () => {
    it("an existing member cannot be edited or promoted", async () => {
      await assertFails(updateDoc(doc(asAlice(env), `${members(F1)}/bobMember`), { role: "admin" }));
      await assertFails(updateDoc(doc(asBob(env), `${members(F1)}/bobMember`), { role: "admin" }));
      await assertFails(updateDoc(doc(asBob(env), `${members(F1)}/bobMember`), { canAddExpenses: false }));
    });

    it("members cannot be deleted (remove-member is not built)", async () => {
      await assertFails(deleteDoc(doc(asAlice(env), `${members(F1)}/bobMember`)));
    });

    it("a pending member cannot be hijacked without the matching invitation", async () => {
      await seed(env, [
        [`${members(F1)}/inv1`, memberData({ displayName: "Newbie", inviteEmail: "newbie@example.com" })],
      ]);
      // newbie has no invitation document, so activating the member must fail.
      const db = as(env, "newbie", "newbie@example.com");
      const batch = writeBatch(db);
      batch.set(doc(db, "users/newbie"), { name: "N", email: "newbie@example.com", familyId: F1, createdAt: serverTimestamp() });
      batch.update(doc(db, `${members(F1)}/inv1`), { userId: "newbie", status: "active", joinedAt: serverTimestamp() });
      await assertFails(batch.commit());
    });
  });
});

describe("cross-family isolation", () => {
  it("an old user (created long ago) still cannot read the other family's data", async () => {
    await seed(env, [["users/carol", { name: "Carol", email: "carol@example.com", familyId: F2, createdAt: daysAgo(500) }]]);
    await assertFails(getDoc(doc(asCarol(env), `families/${F1}`)));
    await assertFails(getDocs(collection(asCarol(env), `families/${F1}/members`)));
  });
});
