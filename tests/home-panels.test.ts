import { describe, expect, test } from "vitest";
import {
  addPanel,
  draftFromLayout,
  moveGroup,
  movePanel,
  removePanel,
  updatePanel,
  type Draft,
  type DraftResult,
} from "@/features/home/draft";
import { PANEL_TYPES } from "@/features/home/panel-types";

const empty = (): Draft =>
  draftFromLayout({ pins: [], panels: [], groups: [] }, { pins_order: "manual", history_count: 3 });

function ok(r: DraftResult): Draft {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

const counter = (d: Draft, label: string, size = "md") =>
  addPanel(d, { typeKey: "general.counter", size, config: { label } });
const note = (d: Draft, title: string, size = "md") => addPanel(d, { typeKey: "general.note", size, config: { title } });
const names = (d: Draft) => d.groups.flatMap((g) => g.panels.map((p) => String(p.config.label ?? p.config.title ?? p.typeKey)));

describe("sizes", () => {
  test("every panel type accepts each size it declares", () => {
    for (const type of PANEL_TYPES) {
      for (const size of type.sizes) {
        const config = type.key === "general.counter" ? { label: "C" } : type.key === "general.note" ? { title: "N" } : {};
        expect(addPanel(empty(), { typeKey: type.key, size, config }).ok, `${type.key} ${size}`).toBe(true);
      }
    }
  });

  test("a size the type does not support is rejected", () => {
    expect(note(empty(), "N", "sm")).toEqual({ ok: false, error: "Este painel não tem esse tamanho." });
    expect(note(empty(), "N", "xl").ok).toBe(false);
    const d = ok(note(empty(), "N"));
    expect(updatePanel(d, d.groups[0].panels[0].id, { size: "sm" })).toEqual({
      ok: false,
      error: "Este painel não tem esse tamanho.",
    });
  });
});

test("a single-instance type can be added only once; counters many times", () => {
  const d = ok(addPanel(empty(), { typeKey: "tasks.open-count", size: "md" }));
  expect(addPanel(d, { typeKey: "tasks.open-count", size: "sm" })).toEqual({ ok: false, error: "Este painel já está no início." });
  expect(ok(counter(ok(counter(d, "A")), "B")).groups[1].panels).toHaveLength(2);
});

test("config is validated per type and defaults are filled in", () => {
  expect(counter(empty(), "")).toEqual({ ok: false, error: "Informe um nome." });
  expect(addPanel(empty(), { typeKey: "general.counter", size: "md", config: { label: "A", goal: 0 } })).toEqual({
    ok: false,
    error: "A meta precisa ser pelo menos 1.",
  });
  expect(addPanel(empty(), { typeKey: "nope", size: "md" })).toEqual({ ok: false, error: "Tipo de painel desconhecido." });
  expect(ok(counter(empty(), "Água")).groups[0].panels[0].config).toEqual({ label: "Água", value: 0, goal: null });
});

test("panels go into their feature's group; groups are created in order of first use", () => {
  let d = ok(counter(empty(), "A"));
  d = ok(addPanel(d, { typeKey: "tasks.open-count", size: "md" }));
  d = ok(note(d, "N"));
  expect(d.groups.map((g) => [g.key, g.panels.length])).toEqual([
    ["general", 2],
    ["tasks", 1],
  ]);
});

test("panels move inside their group and groups move, like drag and drop", () => {
  let d = ok(counter(empty(), "A"));
  d = ok(counter(d, "B"));
  d = ok(counter(d, "C"));
  d = ok(addPanel(d, { typeKey: "tasks.open-count", size: "md" }));
  d = ok(movePanel(d, "general", 0, 2));
  expect(names(d)).toEqual(["B", "C", "A", "tasks.open-count"]);
  expect(d.changes.at(-1)).toBe("Painel “A” movido");
  d = ok(moveGroup(d, 1, 0, "Tarefas"));
  expect(d.groups.map((g) => g.key)).toEqual(["tasks", "general"]);
  expect(d.changes.at(-1)).toBe("Grupo “Tarefas” movido");
  expect(movePanel(d, "general", 0, 5).ok).toBe(false);
});

test("removing the last panel of a group drops the group", () => {
  let d = ok(counter(empty(), "A"));
  d = ok(addPanel(d, { typeKey: "tasks.open-count", size: "md" }));
  d = ok(removePanel(d, d.groups[0].panels[0].id));
  expect(d.groups.map((g) => g.key)).toEqual(["tasks"]);
  expect(d.changes.at(-1)).toBe("Painel “A” removido");
});

test("updating config merges with the current config and names the change", () => {
  let d = ok(counter(empty(), "A"));
  const id = d.groups[0].panels[0].id;
  d = ok(updatePanel(d, id, { config: { goal: 8 } }));
  expect(d.groups[0].panels[0].config).toEqual({ label: "A", value: 0, goal: 8 });
  expect(d.changes.at(-1)).toBe("Painel “A” alterado");
  d = ok(updatePanel(d, id, { size: "lg" }));
  expect(d.changes.at(-1)).toBe("Painel “A” agora é grande");
});
