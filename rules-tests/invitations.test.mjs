import { after, before, beforeEach, describe, it } from "node:test";

import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch } from "firebase/firestore";
import { as, asAlice, asCarol, createEnv, daysAgo, F1, F2, memberData, readDoc, seed, seedFamilies } from "./setup.mjs";

const EMAIL = "newbie@example.com";
const INVITE_PATH = `familyInvitations/${EMAIL}`;
const MEMBER_PATH = `families/${F1}/members/inv1`;

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

/** A pending member and its invitation issued `age` days ago. */
async function seedInvitation(age, overrides = {}) {
  await seed(env, [
    [MEMBER_PATH, memberData({ displayName: "Newbie", inviteEmail: EMAIL })],
    [
      INVITE_PATH,
      {
        familyId: F1,
        memberId: "inv1",
        email: EMAIL,
        invitedBy: "alice",
        status: "pending",
        createdAt: daysAgo(age),
        ...overrides,
      },
    ],
  ]);
}

const newbie = () => as(env, "newbie", EMAIL);

/** What registration writes when the invitation is claimed. */
function claimBatch(db) {
  const batch = writeBatch(db);
  batch.set(doc(db, "users/newbie"), { name: "Newbie", email: EMAIL, familyId: F1, createdAt: serverTimestamp() });
  batch.update(doc(db, MEMBER_PATH), { userId: "newbie", status: "active", joinedAt: serverTimestamp() });
  batch.update(doc(db, INVITE_PATH), { status: "accepted" });
  return batch;
}

/** What registration writes when there is no (valid) invitation. */
function ownFamilyBatch(db, uid, familyId) {
  const batch = writeBatch(db);
  batch.set(doc(db, `users/${uid}`), {
    name: "Newbie",
    email: EMAIL,
    familyId,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, `families/${familyId}`), { name: "Newbie's Family", ownerId: uid, createdAt: serverTimestamp() });
  batch.set(doc(db, `families/${familyId}/members/${uid}`), {
    userId: uid,
    displayName: "Newbie",
    relationship: "Other",
    role: "admin",
    status: "active",
    inviteEmail: null,
    canAddExpenses: true,
    joinedAt: serverTimestamp(),
  });
  return batch;
}

describe("creating an invitation", () => {
  const inviteBatch = (db, email = "fresh@example.com") => {
    const batch = writeBatch(db);
    batch.set(doc(db, `families/${F1}/members/m9`), memberData({ displayName: "Fresh", inviteEmail: email }));
    batch.set(doc(db, `familyInvitations/${email}`), {
      familyId: F1,
      memberId: "m9",
      email,
      invitedBy: "alice",
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return batch;
  };

  it("the family owner can invite a new email", async () => {
    await assertSucceeds(inviteBatch(asAlice(env)).commit());
  });

  it("a plain member cannot invite", async () => {
    const bob = as(env, "bob", "bob@example.com");
    const batch = writeBatch(bob);
    batch.set(doc(bob, `families/${F1}/members/m9`), memberData({ displayName: "Fresh", inviteEmail: "fresh@example.com" }));
    await assertFails(batch.commit());
  });

  it("another family's owner cannot invite into this family", async () => {
    await assertFails(inviteBatch(asCarol(env)).commit());
  });

  it("an existing invitation cannot be overwritten by creating it again", async () => {
    await seedInvitation(1);
    await assertFails(inviteBatch(asAlice(env), EMAIL).commit());
  });

  it("an invitation with a createdAt other than the server time is rejected", async () => {
    const db = asAlice(env);
    const batch = writeBatch(db);
    batch.set(doc(db, `families/${F1}/members/m9`), memberData({ displayName: "Fresh", inviteEmail: "fresh@example.com" }));
    batch.set(doc(db, "familyInvitations/fresh@example.com"), {
      familyId: F1,
      memberId: "m9",
      email: "fresh@example.com",
      invitedBy: "alice",
      status: "pending",
      createdAt: Timestamp.fromDate(new Date(Date.now() + 365 * 86400000)),
    });
    await assertFails(batch.commit());
  });
});

describe("reading an invitation", () => {
  beforeEach(() => seedInvitation(1));

  it("the invited email can read it", async () => {
    await assertSucceeds(getDoc(doc(newbie(), INVITE_PATH)));
  });

  it("the inviting family's owner can read it", async () => {
    await assertSucceeds(getDoc(doc(asAlice(env), INVITE_PATH)));
  });

  it("another family's owner cannot read it", async () => {
    await assertFails(getDoc(doc(asCarol(env), INVITE_PATH)));
  });

  it("nobody can delete it", async () => {
    await assertFails(deleteDoc(doc(asAlice(env), INVITE_PATH)));
    await assertFails(deleteDoc(doc(newbie(), INVITE_PATH)));
  });
});

describe("claiming an invitation at registration", () => {
  it("works for a fresh invitation", async () => {
    await seedInvitation(1);
    await assertSucceeds(claimBatch(newbie()).commit());
  });

  it("still works on day 29", async () => {
    await seedInvitation(29);
    await assertSucceeds(claimBatch(newbie()).commit());
  });

  it("works for an old invitation that has no fields beyond the original ones (backward compatible)", async () => {
    // The original invitation shape: exactly familyId, memberId, email, invitedBy, status, createdAt.
    await seedInvitation(5);
    await assertSucceeds(claimBatch(newbie()).commit());
  });

  it("is rejected on day 31", async () => {
    await seedInvitation(31);
    await assertFails(claimBatch(newbie()).commit());
  });

  it("is rejected for a long-expired invitation", async () => {
    await seedInvitation(200);
    await assertFails(claimBatch(newbie()).commit());
  });

  // The next two isolate ONE rule each: the user profile already exists, so the only thing that
  // differs between the pass and the fail case is the invitation's age.
  describe("with the profile already written", () => {
    beforeEach(() =>
      seed(env, [["users/newbie", { name: "Newbie", email: EMAIL, familyId: F1, createdAt: daysAgo(0) }]]),
    );

    it("marking the invitation accepted works while it is valid, not once it has expired", async () => {
      await seedInvitation(1);
      await assertSucceeds(updateDoc(doc(newbie(), INVITE_PATH), { status: "accepted" }));
      await seedInvitation(40);
      await assertFails(updateDoc(doc(newbie(), INVITE_PATH), { status: "accepted" }));
    });

    it("activating the member works while the invitation is valid, not once it has expired", async () => {
      const activate = () =>
        updateDoc(doc(newbie(), MEMBER_PATH), { userId: "newbie", status: "active", joinedAt: serverTimestamp() });
      await seedInvitation(1);
      await assertSucceeds(activate());
      await seedInvitation(40);
      await assertFails(activate());
    });
  });

  it("someone else's email cannot claim it", async () => {
    await seedInvitation(1);
    const mallory = as(env, "mallory", "mallory@example.com");
    const batch = writeBatch(mallory);
    batch.set(doc(mallory, "users/mallory"), {
      name: "Mallory",
      email: "mallory@example.com",
      familyId: F1,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(mallory, MEMBER_PATH), { userId: "mallory", status: "active", joinedAt: serverTimestamp() });
    await assertFails(batch.commit());
  });

  it("an accepted invitation cannot be claimed again", async () => {
    await seedInvitation(1, { status: "accepted" });
    await assertFails(claimBatch(newbie()).commit());
  });

  it("with an expired invitation the person registers normally and gets their own family", async () => {
    await seedInvitation(40);
    await assertSucceeds(ownFamilyBatch(newbie(), "newbie", "newbieFamily").commit());
  });

  it("with an expired invitation the person cannot join the OLD family by pointing the profile at it", async () => {
    await seedInvitation(40);
    const db = newbie();
    await assertFails(
      setDoc(doc(db, "users/newbie"), { name: "Newbie", email: EMAIL, familyId: F1, createdAt: serverTimestamp() }),
    );
  });

  it("the old member stays pending after an expired invitation is ignored", async () => {
    await seedInvitation(40);
    await assertSucceeds(ownFamilyBatch(newbie(), "newbie", "newbieFamily").commit());
    const member = await readDoc(env, MEMBER_PATH);
    if (member.status !== "pending" || member.userId !== null) {
      throw new Error("the expired member should not have been activated");
    }
  });
});

describe("renewing an expired invitation", () => {
  const renew = (db, data = { createdAt: serverTimestamp() }) => updateDoc(doc(db, INVITE_PATH), data);

  it("the family owner can renew an expired invitation", async () => {
    await seedInvitation(45);
    await assertSucceeds(renew(asAlice(env)));
  });

  it("after renewal the invitation can be claimed again", async () => {
    await seedInvitation(45);
    await assertSucceeds(renew(asAlice(env)));
    await assertSucceeds(claimBatch(newbie()).commit());
  });

  it("renewal keeps familyId, memberId, email, invitedBy and status", async () => {
    await seedInvitation(45);
    await assertSucceeds(renew(asAlice(env)));
    const data = await readDoc(env, INVITE_PATH);
    if (data.familyId !== F1 || data.memberId !== "inv1" || data.email !== EMAIL || data.status !== "pending") {
      throw new Error("renewal changed a field it should not touch");
    }
  });

  it("a valid (not yet expired) invitation cannot be renewed", async () => {
    await seedInvitation(10);
    await assertFails(renew(asAlice(env)));
  });

  it("an invitation at 29 days cannot be renewed, one at 31 days can", async () => {
    await seedInvitation(29);
    await assertFails(renew(asAlice(env)));
    await seed(env, [[INVITE_PATH, { familyId: F1, memberId: "inv1", email: EMAIL, invitedBy: "alice", status: "pending", createdAt: daysAgo(31) }]]);
    await assertSucceeds(renew(asAlice(env)));
  });

  it("a non-owner member cannot renew", async () => {
    await seedInvitation(45);
    await assertFails(renew(as(env, "bob", "bob@example.com")));
  });

  it("another family's owner cannot renew", async () => {
    await seedInvitation(45);
    await assertFails(renew(asCarol(env)));
  });

  it("the invited person cannot renew their own invitation", async () => {
    await seedInvitation(45);
    await assertFails(renew(newbie()));
  });

  it("renewal cannot set createdAt to anything but the server time", async () => {
    await seedInvitation(45);
    await assertFails(renew(asAlice(env), { createdAt: Timestamp.fromDate(new Date(Date.now() + 365 * 86400000)) }));
    await assertFails(renew(asAlice(env), { createdAt: daysAgo(1) }));
  });

  it("renewal cannot change familyId, memberId, email, invitedBy or status", async () => {
    await seedInvitation(45);
    const db = asAlice(env);
    await assertFails(renew(db, { createdAt: serverTimestamp(), familyId: F2 }));
    await assertFails(renew(db, { createdAt: serverTimestamp(), memberId: "someoneElse" }));
    await assertFails(renew(db, { createdAt: serverTimestamp(), email: "other@example.com" }));
    await assertFails(renew(db, { createdAt: serverTimestamp(), invitedBy: "bob" }));
    await assertFails(renew(db, { createdAt: serverTimestamp(), status: "accepted" }));
  });

  it("the owner cannot change anything else on an expired invitation", async () => {
    await seedInvitation(45);
    await assertFails(renew(asAlice(env), { status: "accepted" }));
    await assertFails(renew(asAlice(env), { memberId: "other" }));
  });

  it("an accepted invitation cannot be renewed", async () => {
    await seedInvitation(45, { status: "accepted" });
    await assertFails(renew(asAlice(env)));
  });

  it("an invitation whose member is no longer pending cannot be renewed", async () => {
    await seedInvitation(45);
    await seed(env, [[MEMBER_PATH, memberData({ userId: "x", status: "active", inviteEmail: EMAIL, joinedAt: daysAgo(1) })]]);
    await assertFails(renew(asAlice(env)));
  });

  it("renewing never needs a delete: deleting the invitation is still denied", async () => {
    await seedInvitation(45);
    await assertFails(deleteDoc(doc(asAlice(env), INVITE_PATH)));
  });
});
