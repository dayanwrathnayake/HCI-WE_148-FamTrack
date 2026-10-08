// How an expense is split between family members. Pure functions so the Add Shared Expense modal, the
// chooser and the tests all agree.
//
// An expense stores `splitAmong`, the memberIds who share it (1 to 20, all members of the family).
//   - Split ON : the chosen members share it (at least 2 people; everyone is the default).
//   - Split OFF: it is NOT split; only the person who paid bears it, stored as [paidBy].
// Each person's share is derived for display (amount / people), never stored.

export const MIN_SPLIT_PEOPLE = 2;

export type SplitChoice = {
  /** true = split between the selected members, false = not split (only the payer). */
  enabled: boolean;
  /** The members to split between. Kept while split is OFF so turning it back on remembers them. */
  selected: string[];
};

/** Everyone in the family, split on. The default for a new expense. */
export const splitWithEveryone = (activeIds: string[]): SplitChoice => ({
  enabled: true,
  selected: [...activeIds],
});

/**
 * The choice an existing expense already has: two or more people means a split; a single person (or
 * nobody) means it is not split. When split is OFF the selection falls back to everyone.
 */
export function splitChoiceFromExpense(splitAmong: string[], activeIds: string[]): SplitChoice {
  if (splitAmong.length >= MIN_SPLIT_PEOPLE) return { enabled: true, selected: [...splitAmong] };
  return { enabled: false, selected: [...activeIds] };
}

/** An error message when the choice cannot be saved, or null. */
export function validateSplitChoice(choice: SplitChoice, activeIds: string[]): string | null {
  if (!choice.enabled) return null;
  const unique = new Set(choice.selected);
  if (unique.size < MIN_SPLIT_PEOPLE) {
    return `Choose at least ${MIN_SPLIT_PEOPLE} people, or turn splitting off.`;
  }
  for (const id of unique) {
    if (!activeIds.includes(id)) return "You can only split between members of your family.";
  }
  return null;
}

/** The memberIds to store: the chosen members, or just the payer when splitting is off. */
export function getSplitAmong(choice: SplitChoice, paidBy: string): string[] {
  return choice.enabled ? [...new Set(choice.selected)] : [paidBy];
}

/** How many people share the expense. */
export const getSplitPeople = (choice: SplitChoice): number =>
  choice.enabled ? new Set(choice.selected).size : 1;

/** "Split equally · 2 members", "Split equally · 2 of 3 members" or "Not split". */
export function getSplitTitle(choice: SplitChoice, activeCount: number): string {
  if (!choice.enabled) return "Not split";
  const people = getSplitPeople(choice);
  return people === activeCount
    ? `Split equally · ${people} members`
    : `Split equally · ${people} of ${activeCount} members`;
}

/** Whether this member is ticked in the chooser. */
export const isSelected = (choice: SplitChoice, memberId: string): boolean =>
  choice.selected.includes(memberId);

/** Ticks or unticks one member. */
export function toggleMember(choice: SplitChoice, memberId: string): SplitChoice {
  return {
    ...choice,
    selected: isSelected(choice, memberId)
      ? choice.selected.filter((id) => id !== memberId)
      : [...choice.selected, memberId],
  };
}
