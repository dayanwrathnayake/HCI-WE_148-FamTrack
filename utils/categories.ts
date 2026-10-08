import {
  BUDGET_CATEGORIES,
  CATEGORY_IDS,
  DEFAULT_CATEGORY_SHARES,
  OTHER_CATEGORY,
} from "../constants/categories";
import type { CategoryId, CategoryShares } from "../types/models";

// Helpers for the per-category split of a monthly budget. Pure functions so every screen
// derives the same numbers.
//
//   - Only explicit categories are stored, as whole-number percentages (sum <= 100).
//   - "Other" is NEVER stored. Its share is 100 - sum(explicit shares), so removing a category
//     automatically moves its share into Other.
//   - Rupee allocations are derived, never stored (see getCategoryAllocations).

export const isCategoryId = (value: string): value is CategoryId =>
  (CATEGORY_IDS as string[]).includes(value);

const isWholePercentage = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 100;

/**
 * Reads the `categories` field of a stored budget. A budget saved before categories existed has
 * none, and is read as the default split. Unknown or invalid entries are ignored.
 */
export function normalizeShares(raw: unknown): CategoryShares {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ...DEFAULT_CATEGORY_SHARES };
  }
  const shares: CategoryShares = {};
  for (const [id, value] of Object.entries(raw)) {
    if (isCategoryId(id) && isWholePercentage(value)) shares[id] = value;
  }
  return shares;
}

export const getExplicitTotal = (shares: CategoryShares): number =>
  Object.values(shares).reduce<number>((sum, value) => sum + (value ?? 0), 0);

/** Other's percentage: whatever the explicit categories leave. Never negative. */
export const getOtherPercentage = (shares: CategoryShares): number =>
  Math.max(0, 100 - getExplicitTotal(shares));

/** The ids that have a share, in canonical display order. */
export const getShareIds = (shares: CategoryShares): CategoryId[] =>
  CATEGORY_IDS.filter((id) => shares[id] !== undefined);

/** The ids that do not have a share yet (what "+ Add category" may offer). */
export const getUnusedCategoryIds = (shares: CategoryShares): CategoryId[] =>
  CATEGORY_IDS.filter((id) => shares[id] === undefined);

export const withShare = (shares: CategoryShares, id: CategoryId, percentage: number): CategoryShares => ({
  ...shares,
  [id]: percentage,
});

export function withoutShare(shares: CategoryShares, id: CategoryId): CategoryShares {
  const next = { ...shares };
  delete next[id];
  return next;
}

/** Error message for a whole shares map, or null when it can be saved. */
export function validateCategoryShares(shares: unknown): string | null {
  if (typeof shares !== "object" || shares === null || Array.isArray(shares)) {
    return "The category shares are invalid.";
  }
  for (const [id, value] of Object.entries(shares)) {
    if (!isCategoryId(id)) return "One of the categories isn't recognised.";
    if (!isWholePercentage(value)) return "Each category share must be a whole number from 1 to 100.";
  }
  const total = getExplicitTotal(shares as CategoryShares);
  if (total > 100) {
    return `Category shares add up to ${total}%. They can't be more than 100%.`;
  }
  return null;
}

/**
 * Error message for one share typed into the category modal, or null when it is acceptable.
 * `maxAllowed` is how much of the 100% is still free for this category.
 */
export function validateSharePercentage(text: string, maxAllowed: number): string | null {
  const trimmed = text.trim();
  if (maxAllowed < 1) return "No percentage is left. Reduce another category first.";
  if (!/^\d+$/.test(trimmed)) return `Enter a whole number from 1 to ${maxAllowed}.`;
  const value = Number(trimmed);
  if (value < 1) return `Enter a whole number from 1 to ${maxAllowed}.`;
  if (value > maxAllowed) {
    return `Only ${maxAllowed}% is left to give. Enter ${maxAllowed} or less, or reduce another category first.`;
  }
  return null;
}

export type CategoryAllocation = {
  id: CategoryId | "other";
  label: string;
  emoji: string;
  iconBackground: string;
  fillColor: string;
  percentage: number;
  /** Rupees. All allocations of a budget always add up to exactly the budget amount. */
  amount: number;
};

/**
 * Splits a budget amount across its categories, explicit ones first (canonical order) and Other
 * last. Each explicit allocation is round(amount * percentage / 100); Other is then DERIVED as
 * amount - sum(explicit allocations), so the rows always total exactly the budget.
 *
 * Two edge cases only arise from rounding on tiny amounts: when the explicit shares total 100%
 * (Other must be exactly 0) or the rounded explicit rupees overshoot the budget (Other would be
 * negative). In both, the difference is absorbed by the largest explicit category, so Other is
 * never negative and is 0 whenever its share is 0%.
 */
export function getCategoryAllocations(amount: number, shares: CategoryShares): CategoryAllocation[] {
  const total = Math.max(0, Math.round(amount));
  const explicit: CategoryAllocation[] = BUDGET_CATEGORIES.filter(
    (category) => shares[category.id] !== undefined,
  ).map((category) => {
    const percentage = shares[category.id] as number;
    return {
      id: category.id,
      label: category.label,
      emoji: category.emoji,
      iconBackground: category.iconBackground,
      fillColor: category.fillColor,
      percentage,
      amount: Math.round((total * percentage) / 100),
    };
  });

  const otherPercentage = getOtherPercentage(shares);
  let otherAmount = total - explicit.reduce((sum, row) => sum + row.amount, 0);

  if ((otherPercentage === 0 || otherAmount < 0) && explicit.length > 0) {
    const largest = explicit.reduce((best, row) => (row.amount > best.amount ? row : best), explicit[0]);
    largest.amount += otherAmount;
    otherAmount = 0;
  }

  return [
    ...explicit,
    {
      id: OTHER_CATEGORY.id,
      label: OTHER_CATEGORY.label,
      emoji: OTHER_CATEGORY.emoji,
      iconBackground: OTHER_CATEGORY.iconBackground,
      fillColor: OTHER_CATEGORY.fillColor,
      percentage: otherPercentage,
      amount: otherAmount,
    },
  ];
}
