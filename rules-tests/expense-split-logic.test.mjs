// How an expense is split (utils/expenseSplit.ts). Plain Node tests, no emulator data needed.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getSplitAmong,
  getSplitPeople,
  getSplitTitle,
  isSelected,
  splitChoiceFromExpense,
  splitWithEveryone,
  toggleMember,
  validateSplitChoice,
} from "../utils/expenseSplit.ts";

const ACTIVE = ["alice", "bob", "dana"];

describe("default and existing splits", () => {
  it("a new expense splits with everyone", () => {
    assert.deepEqual(splitWithEveryone(ACTIVE), { enabled: true, selected: ["alice", "bob", "dana"] });
  });

  it("an existing split of 2 or more people is a split", () => {
    assert.deepEqual(splitChoiceFromExpense(["alice", "bob"], ACTIVE), { enabled: true, selected: ["alice", "bob"] });
  });

  it("an existing split of one person (or nobody) is not split, and remembers everyone for turning it on", () => {
    assert.deepEqual(splitChoiceFromExpense(["alice"], ACTIVE), { enabled: false, selected: ACTIVE });
    assert.deepEqual(splitChoiceFromExpense([], ACTIVE), { enabled: false, selected: ACTIVE });
  });
});

describe("what gets stored", () => {
  it("split on stores the chosen members", () => {
    assert.deepEqual(getSplitAmong({ enabled: true, selected: ["alice", "dana"] }, "alice"), ["alice", "dana"]);
  });

  it("split on never stores a member twice", () => {
    assert.deepEqual(getSplitAmong({ enabled: true, selected: ["alice", "alice", "bob"] }, "alice"), ["alice", "bob"]);
  });

  it("split off stores only the payer, whoever the payer is", () => {
    assert.deepEqual(getSplitAmong({ enabled: false, selected: ACTIVE }, "bob"), ["bob"]);
  });

  it("the number of people sharing it", () => {
    assert.equal(getSplitPeople({ enabled: true, selected: ["alice", "bob", "dana"] }), 3);
    assert.equal(getSplitPeople({ enabled: true, selected: ["alice", "alice"] }), 1);
    assert.equal(getSplitPeople({ enabled: false, selected: ACTIVE }), 1);
  });
});

describe("validation", () => {
  it("split off is always valid", () => {
    assert.equal(validateSplitChoice({ enabled: false, selected: [] }, ACTIVE), null);
  });

  it("split on needs at least 2 different people", () => {
    const message = "Choose at least 2 people, or turn splitting off.";
    assert.equal(validateSplitChoice({ enabled: true, selected: [] }, ACTIVE), message);
    assert.equal(validateSplitChoice({ enabled: true, selected: ["alice"] }, ACTIVE), message);
    assert.equal(validateSplitChoice({ enabled: true, selected: ["alice", "alice"] }, ACTIVE), message);
  });

  it("2 or more members of the family is valid", () => {
    assert.equal(validateSplitChoice({ enabled: true, selected: ["alice", "bob"] }, ACTIVE), null);
    assert.equal(validateSplitChoice({ enabled: true, selected: ACTIVE }, ACTIVE), null);
  });

  it("someone outside the family is rejected", () => {
    assert.equal(
      validateSplitChoice({ enabled: true, selected: ["alice", "stranger"] }, ACTIVE),
      "You can only split between members of your family.",
    );
  });
});

describe("the chooser", () => {
  it("ticking and unticking members", () => {
    let choice = { enabled: true, selected: ["alice", "bob"] };
    choice = toggleMember(choice, "dana");
    assert.deepEqual(choice.selected, ["alice", "bob", "dana"]);
    choice = toggleMember(choice, "bob");
    assert.deepEqual(choice.selected, ["alice", "dana"]);
    assert.equal(isSelected(choice, "alice"), true);
    assert.equal(isSelected(choice, "bob"), false);
  });

  it("toggling keeps the on/off setting", () => {
    assert.equal(toggleMember({ enabled: false, selected: ["alice"] }, "bob").enabled, false);
  });

  it("the card title", () => {
    assert.equal(getSplitTitle({ enabled: true, selected: ACTIVE }, 3), "Split equally · 3 members");
    assert.equal(getSplitTitle({ enabled: true, selected: ["alice", "bob"] }, 3), "Split equally · 2 of 3 members");
    assert.equal(getSplitTitle({ enabled: false, selected: ACTIVE }, 3), "Not split");
  });
});
