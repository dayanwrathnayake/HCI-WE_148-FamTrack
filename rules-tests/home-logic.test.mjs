// Logic behind the Home budget card (utils/home.ts). Plain Node tests, no emulator data needed.
// `spent` and `byCategory` are the SHARED-only numbers ExpenseContext computes (Pending expenses are
// already excluded there), so the card can never count a Pending expense.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getHomeBudgetSummary, getPillBackground, getTopSpendingCategories } from "../utils/home.ts";

const summary = (overrides = {}) =>
  getHomeBudgetSummary({ budgetStatus: "ready", expenseStatus: "ready", budgetAmount: 60000, spent: 24500, ...overrides });

describe("Home budget card: numbers", () => {
  it("a normal month: left, spent and progress come from budget and shared spending", () => {
    const s = summary();
    assert.equal(s.state, "ready");
    assert.equal(s.budget, 60000);
    assert.equal(s.spent, 24500);
    assert.equal(s.left, 35500);
    assert.equal(s.over, 0);
    assert.equal(s.overBudget, false);
    assert.ok(Math.abs(s.progress - 24500 / 60000) < 1e-9);
  });

  it("no spending yet: everything is left and the bar is empty", () => {
    const s = summary({ spent: 0 });
    assert.equal(s.left, 60000);
    assert.equal(s.progress, 0);
    assert.equal(s.overBudget, false);
  });

  it("over budget: left stays at 0, over is the excess, the bar is full", () => {
    const s = summary({ spent: 70000 });
    assert.equal(s.left, 0);
    assert.equal(s.over, 10000);
    assert.equal(s.overBudget, true);
    assert.equal(s.progress, 1);
  });

  it("spending exactly the budget: left 0, nothing over, flagged as at the limit", () => {
    const s = summary({ spent: 60000 });
    assert.equal(s.left, 0);
    assert.equal(s.over, 0);
    assert.equal(s.overBudget, true);
    assert.equal(s.progress, 1);
  });

  it("one rupee under the budget is not over budget", () => {
    const s = summary({ spent: 59999 });
    assert.equal(s.left, 1);
    assert.equal(s.overBudget, false);
  });
});

describe("Home budget card: states", () => {
  it("loading while either source is still loading, never half-shown", () => {
    for (const overrides of [
      { budgetStatus: "idle" },
      { budgetStatus: "loading" },
      { expenseStatus: "idle" },
      { expenseStatus: "loading" },
    ]) {
      const s = summary(overrides);
      assert.equal(s.state, "loading", JSON.stringify(overrides));
      assert.equal(s.spent, 0);
      assert.equal(s.progress, 0);
    }
  });

  it("error when either listener failed, even if the other is still loading", () => {
    assert.equal(summary({ budgetStatus: "error" }).state, "error");
    assert.equal(summary({ expenseStatus: "error" }).state, "error");
    assert.equal(summary({ budgetStatus: "loading", expenseStatus: "error" }).state, "error");
  });

  it("no budget this month: state no-budget, spending still shown, bar empty, nothing over", () => {
    const s = summary({ budgetStatus: "none", budgetAmount: null, spent: 8000 });
    assert.equal(s.state, "no-budget");
    assert.equal(s.spent, 8000);
    assert.equal(s.budget, 0);
    assert.equal(s.left, 0);
    assert.equal(s.over, 0);
    assert.equal(s.overBudget, false);
    assert.equal(s.progress, 0);
  });

  it("a budget of 0 or a missing amount is treated as no budget (no divide by zero)", () => {
    assert.equal(summary({ budgetAmount: 0 }).state, "no-budget");
    assert.equal(summary({ budgetAmount: null }).state, "no-budget");
  });

  it("a negative spent never produces a negative bar", () => {
    assert.equal(summary({ spent: -5 }).progress, 0);
  });
});

describe("Home top spending categories", () => {
  it("returns the 3 highest, highest first", () => {
    const top = getTopSpendingCategories({ food: 500, transport: 9000, bills: 1200, health: 3000, other: 100 });
    assert.deepEqual(top, [
      { id: "transport", amount: 9000 },
      { id: "health", amount: 3000 },
      { id: "bills", amount: 1200 },
    ]);
  });

  it("returns fewer than 3 when fewer categories have spending", () => {
    assert.deepEqual(getTopSpendingCategories({ food: 500 }), [{ id: "food", amount: 500 }]);
  });

  it("ignores zero and missing amounts", () => {
    assert.deepEqual(getTopSpendingCategories({ food: 0, shopping: undefined, bills: 40 }), [
      { id: "bills", amount: 40 },
    ]);
  });

  it("is empty when nothing has been spent", () => {
    assert.deepEqual(getTopSpendingCategories({}), []);
  });

  it("breaks ties by category id so the order is stable", () => {
    const top = getTopSpendingCategories({ shopping: 100, food: 100, bills: 100, health: 100 });
    assert.deepEqual(
      top.map((c) => c.id),
      ["bills", "food", "health"],
    );
  });

  it("honours a custom limit", () => {
    assert.equal(getTopSpendingCategories({ food: 1, bills: 2, health: 3 }, 2).length, 2);
  });
});

describe("Home pill background", () => {
  it("is the category colour at 10% opacity", () => {
    assert.equal(getPillBackground("#00c46a"), "#00c46a1A");
    assert.equal(getPillBackground("#9aa3ae"), "#9aa3ae1A");
  });

  it("falls back to light grey for a colour it cannot tint", () => {
    assert.equal(getPillBackground("red"), "#f1f3f5");
    assert.equal(getPillBackground("#fff"), "#f1f3f5");
  });
});
