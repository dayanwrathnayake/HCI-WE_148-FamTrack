// Plain-logic checks for the client helpers that mirror the rules. They need no emulator data
// (Node runs the .ts files directly), but live here so `npm run test:rules` covers everything
// Phase 11 changed.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { INVITATION_VALID_DAYS, isInvitationExpired } from "../utils/invitations.ts";
import { MIN_PASSWORD_LENGTH, validateLoginPassword, validatePassword } from "../utils/validation.ts";

const DAY = 24 * 60 * 60 * 1000;
const issued = (daysAgo, now) => ({ toMillis: () => now - daysAgo * DAY });

describe("password validation", () => {
  it("the minimum is 8 characters", () => {
    assert.equal(MIN_PASSWORD_LENGTH, 8);
  });

  it("rejects an empty password and anything under 8 characters", () => {
    assert.equal(validatePassword(""), "Please enter a password.");
    for (const pw of ["a", "12345", "123456", "1234567"]) {
      assert.equal(validatePassword(pw), "Password must be at least 8 characters.", pw);
    }
  });

  it("accepts 8 characters and longer", () => {
    assert.equal(validatePassword("12345678"), null);
    assert.equal(validatePassword("a much longer passphrase"), null);
  });

  it("login does not enforce the minimum, so older 6-7 character passwords still work", () => {
    assert.equal(validateLoginPassword("123456"), null);
    assert.equal(validateLoginPassword(""), "Please enter your password.");
  });
});

describe("invitation expiry (client side)", () => {
  const now = Date.UTC(2026, 9, 7, 12, 0, 0);

  it("is 30 days", () => {
    assert.equal(INVITATION_VALID_DAYS, 30);
  });

  it("a fresh or 29-day-old invitation is valid", () => {
    assert.equal(isInvitationExpired(issued(0, now), now), false);
    assert.equal(isInvitationExpired(issued(29, now), now), false);
  });

  it("is expired at exactly 30 days and after", () => {
    assert.equal(isInvitationExpired(issued(30, now), now), true);
    assert.equal(isInvitationExpired(issued(31, now), now), true);
    assert.equal(isInvitationExpired(issued(400, now), now), true);
  });

  it("a write the server has not stamped yet is not expired", () => {
    assert.equal(isInvitationExpired(null, now), false);
    assert.equal(isInvitationExpired(undefined, now), false);
  });
});
