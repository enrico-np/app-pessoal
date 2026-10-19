import { describe, expect, test } from "vitest";
import { addPanelMutation, addPinMutation, removePanelMutation, restoreLayoutMutation } from "@/features/home/mutations";
import { getLayout, listPanels } from "@/features/home/queries";
import { emptyStack, pushChange, redo, undo, UNDO_LIMIT } from "@/features/home/undo";
import { createTestDb } from "./helpers/db";

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

describe("restoreLayoutMutation", () => {
  test("restoring `before` undoes a removal with the same ids; `after` redoes it", () => {
    const db = createTestDb();
    addPinMutation(db, { label: "A", icon: "star", href: "/" });
    addPanelMutation(db, { typeKey: "general.counter", size: "lg", config: { label: "Água", goal: 8 } });
    const removed = removePanelMutation(db, listPanels(db)[0].id);
    if (!removed.ok) throw new Error(removed.error);
    expect(listPanels(db)).toEqual([]);

    expect(restoreLayoutMutation(db, removed.data.before, "undo")).toEqual({ ok: true });
    expect(getLayout(db)).toEqual(removed.data.before);

    expect(restoreLayoutMutation(db, removed.data.after, "redo")).toEqual({ ok: true });
    expect(getLayout(db)).toEqual(removed.data.after);
  });

  test("a snapshot with an unknown panel type is rejected and nothing changes", () => {
    const db = createTestDb();
    addPanelMutation(db, { typeKey: "general.counter", size: "md", config: { label: "A" } });
    const layout = getLayout(db);
    const bad = { ...layout, panels: layout.panels.map((p) => ({ ...p, typeKey: "x" })) };
    expect(restoreLayoutMutation(db, bad, "undo").ok).toBe(false);
    expect(getLayout(db)).toEqual(layout);
  });
});
