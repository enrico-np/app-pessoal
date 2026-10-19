import { describe, expect, test } from "vitest";
import { emptyStack, pushChange, redo, undo, UNDO_LIMIT } from "@/features/home/undo";

describe("undo stack", () => {
  const entry = (n: number) => ({ label: `c${n}`, before: n - 1, after: n });

  test("undo moves the last change to the redo list; redo moves it back", () => {
    let s = pushChange(pushChange(emptyStack<number>(), entry(1)), entry(2));
    const u = undo(s);
    expect(u.entry?.before).toBe(1);
    s = u.stack;
    expect(s.past.map((e) => e.label)).toEqual(["c1"]);
    const r = redo(s);
    expect(r.entry?.after).toBe(2);
    expect(r.stack.past.map((e) => e.label)).toEqual(["c1", "c2"]);
  });

  test("a new change clears redo", () => {
    const s = undo(pushChange(emptyStack<number>(), entry(1))).stack;
    expect(pushChange(s, entry(5)).future).toEqual([]);
  });

  test(`keeps at most ${UNDO_LIMIT} changes`, () => {
    let s = emptyStack<number>();
    for (let i = 1; i <= UNDO_LIMIT + 5; i++) s = pushChange(s, entry(i));
    expect(s.past).toHaveLength(UNDO_LIMIT);
    expect(s.past[0].label).toBe("c6");
  });

  test("undo and redo on empty lists change nothing", () => {
    const s = emptyStack<number>();
    expect(undo(s)).toEqual({ stack: s });
    expect(redo(s)).toEqual({ stack: s });
  });
});
