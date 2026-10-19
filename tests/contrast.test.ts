import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

// Spec 002: text contrast at least 4.5:1 in light and dark. Reads the tokens from globals.css so a
// palette change that breaks a pair fails here. Pairs are the text-on-background combinations the UI uses.

const css = readFileSync("src/app/globals.css", "utf8");

function tokens(blockStart: string): Record<string, string> {
  const start = css.indexOf(blockStart);
  if (start < 0) throw new Error(`block not found: ${blockStart}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [text: string, background: string][] = [
  ["foreground", "background"],
  ["foreground", "surface"],
  ["muted", "background"],
  ["muted", "surface"],
  ["accent-foreground", "accent"],
  ["danger-foreground", "danger"],
  ["danger", "surface"],
  ["danger", "background"],
  ["link", "background"],
  ["link", "surface"],
];

describe.each([
  ["light", ":root {"],
  ["dark", ':root[data-theme="dark"] {'],
])("%s theme", (_name, block) => {
  const t = tokens(block);
  test.each(PAIRS)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(t[fg], fg).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
});

test("the two dark blocks in globals.css define the same values", () => {
  expect(tokens(':root:not([data-theme="light"]) {')).toEqual(tokens(':root[data-theme="dark"] {'));
});
