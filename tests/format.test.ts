import { expect, test } from "vitest";
import { formatInteger, formatNumber } from "@/lib/format";

test("formatInteger uses a dot as thousands separator", () => {
  expect(formatInteger(1234567)).toBe("1.234.567");
});

test("formatInteger rounds fractions", () => {
  expect(formatInteger(2.6)).toBe("3");
});

test("formatNumber uses a comma as decimal mark and keeps up to 2 decimals", () => {
  expect(formatNumber(1234.5)).toBe("1.234,5");
  expect(formatNumber(0.125)).toBe("0,13");
});

test("formatInteger handles negatives", () => {
  expect(formatInteger(-42)).toBe("-42");
});
