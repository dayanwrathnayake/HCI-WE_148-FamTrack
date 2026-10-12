export function parseIncomeAmount(text: string): number {
  const clean = text.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) throw new Error("Enter a positive amount with no more than two decimal places.");
  const [whole, fraction = ""] = clean.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents < 1 || cents > 10000000000) throw new Error("Enter an amount between Rs 0.01 and Rs 100,000,000.");
  return cents;
}
export function parseIncomeDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Select a valid date.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCFullYear() < 2000 || date.getUTCFullYear() > 2100) throw new Error("Select a valid date between 2000 and 2100.");
  return date;
}
