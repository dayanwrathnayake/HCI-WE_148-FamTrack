// Each validator returns an error message, or null when the value is acceptable.

export const MAX_NAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 6;

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
