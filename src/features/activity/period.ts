import { parseIsoDay } from "@/lib/calendar";
import { formatShortDate, startOfDay } from "@/lib/format";

export const PERIOD_PRESETS = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "Últimos 7 dias" },
  { key: "30d", label: "Últimos 30 dias" },
  { key: "mes", label: "Este mês" },
] as const;

export type PeriodKey = (typeof PERIOD_PRESETS)[number]["key"] | "custom" | "all";

export type Period = {
  key: PeriodKey;
  from?: Date; // inclusive, local midnight
  to?: Date; // exclusive, local midnight after the last day
  label: string;
};

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// "12 a 18 de out." in one month, "28 de set. a 3 de out." across months.
function rangeLabel(first: Date, last: Date): string {
  const end = formatShortDate(last);
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return `${first.getDate()} a ${end}`;
  }
  return `${formatShortDate(first)} a ${end}`;
}

// Reads ?periodo=hoje|7d|30d|mes or ?de=YYYY-MM-DD&ate=YYYY-MM-DD. Anything invalid means the whole history.
// Days in the future are cut at today; reversed ranges are swapped.
export function parsePeriod(params: { periodo?: string; de?: string; ate?: string }, now: Date): Period {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  switch (params.periodo) {
    case "hoje":
      return { key: "hoje", from: today, to: tomorrow, label: "Hoje" };
    case "7d":
      return { key: "7d", from: addDays(today, -6), to: tomorrow, label: "Últimos 7 dias" };
    case "30d":
      return { key: "30d", from: addDays(today, -29), to: tomorrow, label: "Últimos 30 dias" };
    case "mes":
      return { key: "mes", from: new Date(today.getFullYear(), today.getMonth(), 1), to: tomorrow, label: "Este mês" };
  }
  let first = parseIsoDay(params.de);
  let last = parseIsoDay(params.ate);
  if (!first || !last) return { key: "all", label: "Todo o período" };
  if (first > last) [first, last] = [last, first];
  if (last > today) last = today;
  if (first > today) first = today;
  return { key: "custom", from: first, to: addDays(last, 1), label: rangeLabel(first, last) };
}
