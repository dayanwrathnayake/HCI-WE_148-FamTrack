// Each validator returns an error message, or null when the value is acceptable.

export const MAX_NAME_LENGTH = 100;
// Enforced here only (Firebase Auth itself accepts 6+). Login does not check it, so accounts made
// with a shorter password before this limit can still sign in.
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Please enter your full name.";
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return "Please enter your email address.";
  if (!EMAIL_PATTERN.test(trimmed)) return "Please enter a valid email address.";
  return null;
}

export const PHONE_INVITE_MESSAGE = "Phone invitations aren't supported yet. Please enter an email address.";

export function validateMemberName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Please enter the member's name.";
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  return null;
}

/** Looks like a phone number (digits and phone punctuation only, no "@"). */
export function looksLikePhoneNumber(value: string): boolean {
  const trimmed = value.trim();
  return /^[+\d\s()\-.]+$/.test(trimmed) && trimmed.replace(/\D/g, "").length >= 5;
}

/** Invitations are email-only for now. */
export function validateInviteContact(value: string): string | null {
  if (looksLikePhoneNumber(value)) return PHONE_INVITE_MESSAGE;
  return validateEmail(value);
}

export const MAX_BUDGET_AMOUNT = 100_000_000; // keep in sync with firestore.rules

export function validateBudgetName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "Please enter a budget name.";
  if (trimmed.length > MAX_NAME_LENGTH) return `Budget name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  return null;
}

/** The amount is typed as text ("100,000"); budgets are whole rupees. */
export function validateBudgetAmount(text: string): string | null {
  const digits = text.replace(/[,\s]/g, "");
  if (digits.length === 0) return "Please enter the monthly budget.";
  if (!/^\d+$/.test(digits)) return "Enter the budget as a whole number of rupees.";
  const value = Number(digits);
  if (value < 1) return "The monthly budget must be greater than Rs 0.";
  if (value > MAX_BUDGET_AMOUNT) {
    return `The monthly budget can't be more than Rs ${MAX_BUDGET_AMOUNT.toLocaleString("en-US")}.`;
  }
  return null;
}

export const MAX_EXPENSE_AMOUNT = 100_000_000; // keep in sync with firestore.rules
export const MAX_EXPENSE_NOTE_LENGTH = 500; // keep in sync with firestore.rules

/** The amount is typed as text ("20,000"); expenses are whole rupees. */
export function validateExpenseAmount(text: string): string | null {
  const digits = text.replace(/[,\s]/g, "");
  if (digits.length === 0) return "Please enter the amount.";
  if (!/^\d+$/.test(digits)) return "Enter the amount as a whole number of rupees.";
  const value = Number(digits);
  if (value < 1) return "The amount must be greater than Rs 0.";
  if (value > MAX_EXPENSE_AMOUNT) {
    return `The amount can't be more than Rs ${MAX_EXPENSE_AMOUNT.toLocaleString("en-US")}.`;
  }
  return null;
}

export function validateExpenseNote(note: string): string | null {
  if (note.length > MAX_EXPENSE_NOTE_LENGTH) {
    return `The note must be ${MAX_EXPENSE_NOTE_LENGTH} characters or fewer.`;
  }
  return null;
}

/** Login only needs a password to be present; Firebase decides whether it is correct. */
export function validateLoginPassword(password: string): string | null {
  return password.length === 0 ? "Please enter your password." : null;
}

export function validatePassword(password: string): string | null {
  if (password.length === 0) return "Please enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
