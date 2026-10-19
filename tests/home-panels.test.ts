import { beforeEach, describe, expect, test } from "vitest";
import type { Db } from "@/db/types";
import { listActivity } from "@/features/activity/queries";
import {
  addPanelMutation,
  changeCounterMutation,
  moveGroupMutation,
  movePanelMutation,
  removePanelMutation,
  updatePanelMutation,
} from "@/features/home/mutations";
import { PANEL_TYPES } from "@/features/home/panel-types";
import { getPanel, listGroups, listPanels } from "@/features/home/queries";
import { createTestDb } from "./helpers/db";

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

const counter = (label: string, size = "md") =>
  addPanelMutation(db, { typeKey: "general.counter", size, config: { label } });
const note = (title: string, size = "md") => addPanelMutation(db, { typeKey: "general.note", size, config: { title } });

describe("sizes", () => {
  test("every panel type accepts each size it declares", () => {
    for (const type of PANEL_TYPES) {
      for (const size of type.sizes) {
        db = createTestDb();
        const config = type.key === "general.counter" ? { label: "C" } : type.key === "general.note" ? { title: "N" } : {};
        expect(addPanelMutation(db, { typeKey: type.key, size, config }).ok, `${type.key} ${size}`).toBe(true);
      }
    }
  });

  test("a size the type does not support is rejected", () => {
    expect(note("N", "sm")).toEqual({ ok: false, error: "Este painel não tem esse tamanho." });
    expect(note("N", "xl").ok).toBe(false);
    note("N");
    const id = listPanels(db)[0].id;
    expect(updatePanelMutation(db, id, { size: "sm" })).toEqual({ ok: false, error: "Este painel não tem esse tamanho." });
  });
});

test("a single-instance type can be added only once; counters many times", () => {
  expect(addPanelMutation(db, { typeKey: "tasks.open-count", size: "md" }).ok).toBe(true);
  expect(addPanelMutation(db, { typeKey: "tasks.open-count", size: "sm" })).toEqual({
    ok: false,
    error: "Este painel já está no início.",
  });
  expect(counter("A").ok).toBe(true);
  expect(counter("B").ok).toBe(true);
});

test("config is validated per type and defaults are filled in", () => {
  expect(counter("")).toEqual({ ok: false, error: "Informe um nome." });
  expect(addPanelMutation(db, { typeKey: "general.counter", size: "md", config: { label: "A", goal: 0 } })).toEqual({
    ok: false,
    error: "A meta precisa ser pelo menos 1.",
  });
  expect(addPanelMutation(db, { typeKey: "nope", size: "md" })).toEqual({ ok: false, error: "Tipo de painel desconhecido." });
  counter("Água");
  expect(listPanels(db)[0].config).toEqual({ label: "Água", value: 0, goal: null });
});

test("panels go into their feature's group; groups are created in order of first use", () => {
  counter("A");
  addPanelMutation(db, { typeKey: "tasks.open-count", size: "md" });
  note("N");
  expect(listGroups(db).map((g) => g.groupKey)).toEqual(["general", "tasks"]);
  expect(listPanels(db).map((p) => [p.groupKey, p.position])).toEqual([
    ["general", 0],
    ["general", 1],
    ["tasks", 0],
  ]);
});

test("panels move inside their group; groups move past each other", () => {
  counter("A");
  counter("B");
  addPanelMutation(db, { typeKey: "tasks.open-count", size: "md" });
  const [a] = listPanels(db);
  expect(movePanelMutation(db, a.id, "later").ok).toBe(true);
  expect(listPanels(db).map((p) => p.config.label ?? p.typeKey)).toEqual(["B", "A", "tasks.open-count"]);
  expect(movePanelMutation(db, a.id, "later")).toEqual({ ok: false, error: "Este painel já está na ponta." });
  expect(moveGroupMutation(db, "tasks", "earlier", "Tarefas").ok).toBe(true);
  expect(listPanels(db).map((p) => p.groupKey)).toEqual(["tasks", "general", "general"]);
  expect(moveGroupMutation(db, "tasks", "earlier", "Tarefas").ok).toBe(false);
});

test("removing a panel closes the gap in its group", () => {
  counter("A");
  counter("B");
  counter("C");
  removePanelMutation(db, listPanels(db)[0].id);
  expect(listPanels(db).map((p) => [p.config.label, p.position])).toEqual([
    ["B", 0],
    ["C", 1],
  ]);
});

test("updating config merges with the stored config", () => {
  counter("A");
  const id = listPanels(db)[0].id;
  expect(updatePanelMutation(db, id, { config: { goal: 8 } }).ok).toBe(true);
  expect(getPanel(db, id)?.config).toEqual({ label: "A", value: 0, goal: 8 });
});

test("counter changes by +1/-1 only and is logged with old and new value", () => {
  counter("Água");
  const id = listPanels(db)[0].id;
  expect(changeCounterMutation(db, id, 1).ok).toBe(true);
  expect(changeCounterMutation(db, id, 2).ok).toBe(false);
  expect(getPanel(db, id)?.config.value).toBe(1);
  expect(listActivity(db)[0].summary).toBe("Água: 0 → 1");
});
