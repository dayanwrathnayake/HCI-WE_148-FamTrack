export function expenseDate(value?: string) {
  const now = new Date();
  if (value === "Yesterday") now.setDate(now.getDate() - 1);
  else if (value && value !== "Today") {
    const parts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    const parsed = parts ? new Date(Number(parts[3].length === 2 ? `20${parts[3]}` : parts[3]), Number(parts[2]) - 1, Number(parts[1])) : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
    if (!Number.isNaN(parsed.getTime())) return formatDate(parsed);
  }
  return formatDate(now);
}
function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
