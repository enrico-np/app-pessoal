import { describe, expect, test } from "vitest";
import { parsePeriod } from "@/features/activity/period";
import { monthGrid, parseIsoDay, toIsoDay } from "@/lib/calendar";

describe("calendar", () => {
  test("parseIsoDay accepts real days only", () => {
    expect(toIsoDay(parseIsoDay("2026-10-12")!)).toBe("2026-10-12");
    expect(parseIsoDay("2026-02-30")).toBeUndefined();
    expect(parseIsoDay("12/10/2026")).toBeUndefined();
    expect(parseIsoDay(undefined)).toBeUndefined();
  });

  test("monthGrid starts on Sunday and pads to whole weeks", () => {
    const cells = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]?.getDate()).toBe(1);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });
});

describe("parsePeriod", () => {
  const now = new Date(2026, 9, 18, 15, 0);

  test("no parameters means the whole history", () => {
    expect(parsePeriod({}, now)).toEqual({ key: "all", label: "Todo o período" });
  });

  test("7d covers today and the 6 days before, end exclusive", () => {
    const p = parsePeriod({ periodo: "7d" }, now);
    expect(p.from).toEqual(new Date(2026, 9, 12));
    expect(p.to).toEqual(new Date(2026, 9, 19));
  });

  test("este mês starts on day 1", () => {
    expect(parsePeriod({ periodo: "mes" }, now).from).toEqual(new Date(2026, 9, 1));
  });

  test("custom range is inclusive, swaps reversed days and cuts at today", () => {
    expect(parsePeriod({ de: "2026-10-12", ate: "2026-10-18" }, now)).toEqual({
      key: "custom",
      from: new Date(2026, 9, 12),
      to: new Date(2026, 9, 19),
      label: "12 a 18 de out.",
    });
    expect(parsePeriod({ de: "2026-10-14", ate: "2026-10-12" }, now).from).toEqual(new Date(2026, 9, 12));
    expect(parsePeriod({ de: "2026-10-10", ate: "2026-12-01" }, now).to).toEqual(new Date(2026, 9, 19));
    expect(parsePeriod({ de: "2026-09-28", ate: "2026-10-03" }, now).label).toBe("28 de set. a 3 de out.");
  });

  test("an invalid day falls back to the whole history", () => {
    expect(parsePeriod({ de: "2026-10-40", ate: "2026-10-12" }, now).key).toBe("all");
  });
});
