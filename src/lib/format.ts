// All user-facing number and date formatting goes through here (pt-BR, local time zone of the server process).
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const longDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const monthYear = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export function formatInteger(n: number): string {
  return integer.format(n);
}

export function formatNumber(n: number): string {
  return decimal.format(n);
}

// "domingo, 18 de outubro"
export function formatLongDate(d: Date): string {
  return longDate.format(d);
}

// "16 de out." (Intl adds the period after the abbreviated month)
export function formatShortDate(d: Date): string {
  return shortDate.format(d);
}

// "14:32"
export function formatTime(d: Date): string {
  return time.format(d);
}

// "Outubro de 2026"
export function formatMonthYear(d: Date): string {
  return capitalize(monthYear.format(d));
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function yesterdayOf(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
}

// Section title in Histórico: "Hoje", "Ontem" or "Sexta, 16 de outubro".
export function formatDayLabel(d: Date, now: Date): string {
  if (isSameDay(d, now)) return "Hoje";
  if (isSameDay(d, yesterdayOf(now))) return "Ontem";
  return capitalize(formatLongDate(d));
}

// Meta line of a history entry on Início: "hoje, 14:32", "ontem, 21:05" or "16 de out., 12:47".
export function formatWhen(d: Date, now: Date): string {
  if (isSameDay(d, now)) return `hoje, ${formatTime(d)}`;
  if (isSameDay(d, yesterdayOf(now))) return `ontem, ${formatTime(d)}`;
  return `${formatShortDate(d)}, ${formatTime(d)}`;
}
