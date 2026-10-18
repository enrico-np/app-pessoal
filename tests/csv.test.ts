import { expect, test } from "vitest";
import { toCsv } from "@/lib/csv";

test("escapes commas, quotes and newlines", () => {
  expect(toCsv([{ a: 'x,"y"', b: 1 }])).toBe('a,b\n"x,""y""",1');
});

test("empty input gives empty string", () => {
  expect(toCsv([])).toBe("");
});
