import { beforeEach, describe, expect, test } from "vitest";
import type { Db } from "@/db/types";
import {
  addBlock,
  changeCounter,
  getBlock,
  listBlocks,
  moveBlock,
  removeBlock,
  updateBlock,
} from "@/features/menu/queries";
import { newBlockSchema } from "@/features/menu/validation";
import { createTestDb } from "./helpers/db";

const cardKeys = ["open-tasks"];
const parse = (input: unknown) => newBlockSchema(cardKeys).parse(input);
const note = (label: string) => parse({ type: "note", label, config: { text: "" } });

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

// Labels in order, plus a check that positions are exactly 0..n-1.
function order(): string[] {
  const rows = listBlocks(db);
  expect(rows.map((r) => r.position)).toEqual(rows.map((_, i) => i));
  return rows.map((r) => r.label);
}

function seed(...labels: string[]): number[] {
  return labels.map((l) => addBlock(db, note(l)).id);
}

describe("addBlock / listBlocks", () => {
  test("empty database lists nothing", () => {
    expect(listBlocks(db)).toEqual([]);
  });

  test("appends blocks at the end with gapless positions", () => {
    seed("A", "B", "C");
    expect(order()).toEqual(["A", "B", "C"]);
  });

  test("stores config as JSON and reads it back as an object", () => {
    const b = addBlock(db, parse({ type: "shortcut", label: "S", config: { href: "/x" } }));
    expect(getBlock(db, b.id)?.config).toEqual({ href: "/x" });
  });
});

describe("moveBlock", () => {
  test("moves a block one position earlier and later", () => {
    const [, b] = seed("A", "B", "C");
    expect(moveBlock(db, b, "earlier")).toBe(true);
    expect(order()).toEqual(["B", "A", "C"]);
    expect(moveBlock(db, b, "later")).toBe(true);
    expect(moveBlock(db, b, "later")).toBe(true);
    expect(order()).toEqual(["A", "C", "B"]);
  });

  test("returns false at the ends and for a missing id, without changes", () => {
    const [a, , c] = seed("A", "B", "C");
    expect(moveBlock(db, a, "earlier")).toBe(false);
    expect(moveBlock(db, c, "later")).toBe(false);
    expect(moveBlock(db, 999, "later")).toBe(false);
    expect(order()).toEqual(["A", "B", "C"]);
  });
});

describe("removeBlock", () => {
  test("removes only that block and closes the gap", () => {
    const [, b] = seed("A", "B", "C", "D");
    expect(removeBlock(db, b)).toBe(true);
    expect(order()).toEqual(["A", "C", "D"]);
  });

  test("removing first and last keeps positions gapless", () => {
    const [a, , , d] = seed("A", "B", "C", "D");
    removeBlock(db, a);
    removeBlock(db, d);
    expect(order()).toEqual(["B", "C"]);
  });

  test("new block after a removal goes to the end", () => {
    const [a] = seed("A", "B");
    removeBlock(db, a);
    seed("C");
    expect(order()).toEqual(["B", "C"]);
  });

  test("returns false for a missing id", () => {
    expect(removeBlock(db, 999)).toBe(false);
  });
});

describe("updateBlock", () => {
  test("changes label, icon and size", () => {
    const [a] = seed("A");
    const r = updateBlock(db, a, { label: "Novo", icon: "⭐", size: "lg" }, cardKeys);
    expect(r).toMatchObject({ label: "Novo", icon: "⭐", size: "lg" });
  });

  test("validates config against the stored type", () => {
    const s = addBlock(db, parse({ type: "shortcut", label: "S", config: { href: "/x" } }));
    expect(updateBlock(db, s.id, { config: { href: "https://example.com" } }, cardKeys)?.config).toEqual({
      href: "https://example.com",
    });
    expect(() => updateBlock(db, s.id, { config: { href: "//evil.com" } }, cardKeys)).toThrow();
    expect(getBlock(db, s.id)?.config).toEqual({ href: "https://example.com" });
  });

  test("returns undefined for a missing id", () => {
    expect(updateBlock(db, 999, { label: "X" }, cardKeys)).toBeUndefined();
  });
});

describe("changeCounter", () => {
  test("adds and subtracts, including below zero", () => {
    const c = addBlock(db, parse({ type: "counter", label: "Água" }));
    expect(changeCounter(db, c.id, 1)).toBe(1);
    expect(changeCounter(db, c.id, -2)).toBe(-1);
    expect(getBlock(db, c.id)?.config).toEqual({ value: -1 });
  });

  test("returns undefined for non-counter blocks and rejects fractional deltas", () => {
    const [a] = seed("A");
    expect(changeCounter(db, a, 1)).toBeUndefined();
    expect(() => changeCounter(db, a, 0.5)).toThrow();
  });
});
