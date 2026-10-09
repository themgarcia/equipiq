/**
 * Division share helpers. Overlap is the user's judgment: these functions only
 * SUGGEST shares from months entered and describe the months total in plain
 * language. They never decide the final shares.
 */

export interface MonthsEntry {
  months: number | null;
}

/** Suggested shares (0–1) from months entered. Exactly 12 → months/12; otherwise proportional. */
export function suggestShares(entries: MonthsEntry[]): number[] {
  const months = entries.map(e => (e.months && e.months > 0 ? e.months : 0));
  const total = months.reduce((a, b) => a + b, 0);
  if (total <= 0) return months.map(() => 0);
  return months.map(m => m / total);
}

export function totalMonths(entries: MonthsEntry[]): number {
  return entries.reduce((a, e) => a + (e.months && e.months > 0 ? e.months : 0), 0);
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** Plain-language message when months don't make a 12-month year; null when they do. */
export function monthsMessage(entries: MonthsEntry[]): string | null {
  const t = totalMonths(entries);
  if (t === 0 || Math.abs(t - 12) < 0.001) return null;
  if (t > 12) {
    return `You've committed ${fmt(t)} months across a 12-month year. Adjust the shares to decide who carries the overlap.`;
  }
  return `You've committed ${fmt(t)} months of a 12-month year. Adjust the shares so the whole year is carried.`;
}

export const SHARE_TOLERANCE = 0.001;

/** Shares (0–1) must total 100% within tolerance, each above 0. */
export function sharesValid(shares: number[]): boolean {
  if (shares.length === 0) return false;
  if (shares.some(s => !(s > 0) || s > 1)) return false;
  const sum = shares.reduce((a, b) => a + b, 0);
  return Math.abs(sum - 1) <= SHARE_TOLERANCE;
}
