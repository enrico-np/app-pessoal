import { beforeEach, expect, test } from "vitest";
import type { Db } from "@/db/types";
import { listActivity } from "@/features/activity/queries";
import {
  addPanel,
  addPin,
  draftFromLayout,
  movePin,
  removePanel,
  sessionPayload,
  setHistoryCount,
  setPinsOrder,
  type Draft,
  type DraftResult,
} from "@/features/home/draft";
import { changeCounterMutation, saveEditSessionMutation } from "@/features/home/mutations";
import { getLayout, getPanel, listPanels } from "@/features/home/queries";
import { getSettings } from "@/features/settings/queries";
import { createTestDb } from "./helpers/db";

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

function ok(r: DraftResult): Draft {
  if (!r.ok) throw new Error(r.error);
  return r.data;
}

// A draft of the current database, as /editar builds it.
function open(): Draft {
  const s = getSettings(db);
  return draftFromLayout(getLayout(db), { pins_order: s.pins_order, history_count: s.history_count });
}

function save(d: Draft) {
  return saveEditSessionMutation(db, JSON.parse(JSON.stringify(sessionPayload(d))));
}

test("draft steps write nothing; Concluir writes layout, settings and one Histórico row", () => {
  let d = open();
  d = ok(addPin(d, { label: "YT", icon: "music", href: "https://www.youtube.com/" }));
  d = ok(addPin(d, { label: "Hist", icon: "clock", href: "/historico" }));
  d = ok(movePin(d, 1, 0));
  d = ok(addPanel(d, { typeKey: "general.counter", size: "md", config: { label: "Água" } }));
  d = ok(setPinsOrder(d, "usage"));
  d = ok(setHistoryCount(d, 5));
  expect(getLayout(db)).toEqual({ pins: [], panels: [], groups: [] });
  expect(listActivity(db)).toEqual([]);

  expect(save(d)).toEqual({ ok: true });
  const layout = getLayout(db);
  expect(layout.pins.map((p) => [p.label, p.position])).toEqual([
    ["Hist", 0],
    ["YT", 1],
  ]);
  expect(layout.panels.map((p) => p.config.label)).toEqual(["Água"]);
  expect(getSettings(db)).toMatchObject({ pins_order: "usage", history_count: 5 });

  const rows = listActivity(db);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ action: "home.edited", featureKey: "home", summary: "Início editado · 6 mudanças" });
  expect(rows[0].details).toEqual([
    "Atalho “YT” fixado",
    "Atalho “Hist” fixado",
    "Atalho “Hist” movido",
    "Painel “Água” adicionado",
    "Ordenar pelos mais usados ligado",
    "Itens do histórico no início: 5",
  ]);
});

test("existing rows keep their id and created_at; removed rows are deleted", () => {
  let d = open();
  d = ok(addPanel(d, { typeKey: "general.counter", size: "md", config: { label: "A" } }));
  d = ok(addPanel(d, { typeKey: "general.counter", size: "md", config: { label: "B" } }));
  save(d);
  const [a, b] = listPanels(db);

  d = open();
  d = ok(removePanel(d, a.id));
  expect(save(d)).toEqual({ ok: true });
  expect(listPanels(db).map((p) => [p.id, p.config.label, p.position, p.createdAt])).toEqual([
    [b.id, "B", 0, b.createdAt],
  ]);
  expect(listActivity(db)[0].summary).toBe("Início editado · 1 mudança");
});

test("the server repeats every rule and writes nothing when one fails", () => {
  const base = { pins: [], groups: [], settings: { pins_order: "manual", history_count: 3 }, changes: ["x"] };
  const pin = (i: number) => ({ id: -i, label: `P${i}`, icon: "star", href: "/" });
  expect(saveEditSessionMutation(db, { ...base, pins: Array.from({ length: 9 }, (_, i) => pin(i + 1)) })).toEqual({
    ok: false,
    error: "Você já fixou 8 atalhos. Remova um para fixar outro.",
  });
  const panel = (typeKey: string, size: string, config = {}) => ({ id: -1, typeKey, size, config });
  expect(saveEditSessionMutation(db, { ...base, groups: [{ key: "general", panels: [panel("general.note", "sm", { title: "N" })] }] })).toEqual({
    ok: false,
    error: "Este painel não tem esse tamanho.",
  });
  expect(saveEditSessionMutation(db, { ...base, groups: [{ key: "tasks", panels: [panel("general.note", "md", { title: "N" })] }] })).toEqual({
    ok: false,
    error: "Tipo de painel desconhecido.",
  });
  expect(
    saveEditSessionMutation(db, {
      ...base,
      groups: [{ key: "tasks", panels: [panel("tasks.open-count", "md"), { ...panel("tasks.open-count", "sm"), id: -2 }] }],
    }),
  ).toEqual({ ok: false, error: "Este painel já está no início." });
  expect(saveEditSessionMutation(db, { ...base, changes: [] }).ok).toBe(false);
  expect(saveEditSessionMutation(db, { ...base, settings: { pins_order: "manual", history_count: 9 } }).ok).toBe(false);
  expect(getLayout(db)).toEqual({ pins: [], panels: [], groups: [] });
  expect(listActivity(db)).toEqual([]);
});

test("counter changes by +1/-1 only and is logged with old and new value", () => {
  save(ok(addPanel(open(), { typeKey: "general.counter", size: "md", config: { label: "Água" } })));
  const id = listPanels(db)[0].id;
  expect(changeCounterMutation(db, id, 1).ok).toBe(true);
  expect(changeCounterMutation(db, id, 2).ok).toBe(false);
  expect(getPanel(db, id)?.config.value).toBe(1);
  expect(listActivity(db)[0].summary).toBe("Água: 0 → 1");
});
