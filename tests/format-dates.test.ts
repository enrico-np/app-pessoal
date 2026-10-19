import { expect, test } from "vitest";
import { formatDayLabel, formatLongDate, formatMonthYear, formatTime, formatWhen } from "@/lib/format";

const now = new Date(2026, 9, 18, 15, 0); // Sunday, 18 Oct 2026, local time

test("formatLongDate gives weekday, day and month in pt-BR", () => {
  expect(formatLongDate(now)).toBe("domingo, 18 de outubro");
});

test("formatDayLabel names today and yesterday, then the full day", () => {
  expect(formatDayLabel(new Date(2026, 9, 18, 0, 1), now)).toBe("Hoje");
  expect(formatDayLabel(new Date(2026, 9, 17, 23, 59), now)).toBe("Ontem");
  expect(formatDayLabel(new Date(2026, 9, 16, 12, 0), now)).toBe("Sexta-feira, 16 de outubro");
});

test("formatWhen joins the day and a 24 h time", () => {
  expect(formatWhen(new Date(2026, 9, 18, 9, 5), now)).toBe("hoje, 09:05");
  expect(formatWhen(new Date(2026, 9, 17, 21, 5), now)).toBe("ontem, 21:05");
  expect(formatWhen(new Date(2026, 9, 16, 12, 47), now)).toBe("16 de out., 12:47");
  expect(formatTime(new Date(2026, 9, 16, 14, 32))).toBe("14:32");
});

test("formatMonthYear capitalizes the month", () => {
  expect(formatMonthYear(now)).toBe("Outubro de 2026");
});
