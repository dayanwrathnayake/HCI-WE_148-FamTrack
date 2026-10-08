// Which actions the app offers on an expense (utils/expenseActions.ts). Plain Node tests. The Firestore
// rules (expense-actions.test.mjs) are what actually enforce these; this keeps the UI in agreement.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getDeleteLabel, getExpenseActions } from "../utils/expenseActions.ts";

const actions = (overrides = {}) =>
  getExpenseActions({
    isAdmin: false,
    isOwnExpense: false,
    status: "Shared",
    isCurrentMonth: true,
    canAddExpenses: true,
    ...overrides,
  });

describe("admin actions", () => {
  it("a Pending expense can be approved, edited and declined", () => {
    assert.deepEqual(actions({ isAdmin: true, status: "Pending" }), ["approve", "edit", "delete"]);
  });

  it("a Shared expense can be edited and deleted, not approved again", () => {
    assert.deepEqual(actions({ isAdmin: true, status: "Shared" }), ["edit", "delete"]);
  });

  it("the admin's own permission flag does not matter", () => {
    assert.deepEqual(actions({ isAdmin: true, canAddExpenses: false }), ["edit", "delete"]);
  });
});

describe("member actions", () => {
  it("their own Pending expense can be edited and withdrawn", () => {
    assert.deepEqual(actions({ isOwnExpense: true, status: "Pending" }), ["edit", "delete"]);
  });

  it("with can-add-expenses off they can only withdraw their own Pending expense", () => {
    assert.deepEqual(actions({ isOwnExpense: true, status: "Pending", canAddExpenses: false }), ["delete"]);
  });

  it("their own Shared expense has no actions", () => {
    assert.deepEqual(actions({ isOwnExpense: true, status: "Shared" }), []);
  });

  it("someone else's expense has no actions, Pending or Shared", () => {
    assert.deepEqual(actions({ isOwnExpense: false, status: "Pending" }), []);
    assert.deepEqual(actions({ isOwnExpense: false, status: "Shared" }), []);
  });

  it("a member can never approve", () => {
    for (const status of ["Pending", "Shared"]) {
      for (const isOwnExpense of [true, false]) {
        assert.ok(!actions({ isOwnExpense, status }).includes("approve"));
      }
    }
  });
});

describe("history is read-only", () => {
  it("outside the current month nobody gets any action", () => {
    assert.deepEqual(actions({ isAdmin: true, status: "Pending", isCurrentMonth: false }), []);
    assert.deepEqual(actions({ isAdmin: true, status: "Shared", isCurrentMonth: false }), []);
    assert.deepEqual(actions({ isOwnExpense: true, status: "Pending", isCurrentMonth: false }), []);
  });
});

describe("delete label", () => {
  it("the admin declines a Pending expense and deletes a Shared one", () => {
    assert.equal(getDeleteLabel({ isAdmin: true, status: "Pending" }), "Decline expense");
    assert.equal(getDeleteLabel({ isAdmin: true, status: "Shared" }), "Delete expense");
  });

  it("a member withdraws their own Pending expense", () => {
    assert.equal(getDeleteLabel({ isAdmin: false, status: "Pending" }), "Withdraw expense");
  });
});
