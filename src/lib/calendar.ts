// Month grid and ISO day helpers for the period picker. Days are local dates written as "YYYY-MM-DD".

export type IsoDay = string;

export function toIsoDay(d: Date): IsoDay {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Returns undefined for anything that is not a real calendar day (for example 2026-02-30).
export function parseIsoDay(s: string | undefined | null): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : undefined;
}

// Weeks start on Sunday (Brazilian calendars). null cells pad the first and last week.
export function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

export const YEARS_PER_PAGE = 12;

// The 12 years shown together in the year view: blocks aligned to multiples of 12 (2016–2027, 2028–2039).
export function yearPage(year: number): number[] {
  const first = year - (((year % YEARS_PER_PAGE) + YEARS_PER_PAGE) % YEARS_PER_PAGE);
  return Array.from({ length: YEARS_PER_PAGE }, (_, i) => first + i);
}

// True when the month (0-based) starts after `today`. Used to disable months and years in the future.
export function isFutureMonth(year: number, month: number, today: IsoDay): boolean {
  return `${year}-${String(month + 1).padStart(2, "0")}` > today.slice(0, 7);
}
