import { expect, test } from "vitest";
import { toCsv } from "@/lib/csv";

const BOM = "﻿";

test("uses semicolons and quotes cells containing ; \" or newlines", () => {
  expect(toCsv([{ a: 'x;"y"', b: "ok" }])).toBe(`${BOM}a;b\n"x;""y""";ok`);
});

test("keeps commas unquoted since they are not the separator", () => {
  expect(toCsv([{ a: "x,y" }])).toBe(`${BOM}a\nx,y`);
});

test("writes decimals with a comma and integers unchanged", () => {
  expect(toCsv([{ a: 1234.5, b: 7 }])).toBe(`${BOM}a;b\n1234,5;7`);
});

test("writes objects as JSON, quoted because JSON contains double quotes", () => {
  expect(toCsv([{ c: { href: "/x" } }])).toBe(`${BOM}c
"{""href"":""/x""}"`);
});

test("empty input gives empty string", () => {
  expect(toCsv([])).toBe("");
});
