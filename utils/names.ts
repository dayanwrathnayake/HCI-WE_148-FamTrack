/** First non-empty word of a full name ("  Shakna   Rizath " -> "Shakna"), or null if there is none. */
export function getFirstName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first : null;
}
