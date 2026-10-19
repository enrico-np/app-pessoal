import { fail, firstMessage, type DataResult } from "@/lib/result";
import { HISTORY_COUNT_MAX, HISTORY_COUNT_MIN, type PinOrder } from "@/features/settings/validation";
import { panelType, SIZE_LABELS } from "./panel-types";
import type { Layout } from "./queries";
import type { PanelSize } from "./schema";
import { newPanelSchema, panelUpdateSchema, PIN_CAP_MESSAGE, PIN_MAX, pinSchema } from "./validation";

// Edit session draft (spec 003). The edit screen changes this object only; nothing reaches the database
// until Concluir sends it to saveEditSessionMutation. Pure functions, so tests cover them without a browser.
// Each function returns the same draft object when nothing changed, and a new one with one more entry in
// `changes` otherwise.

export type DraftPin = { id: number; label: string; icon: string; href: string };
export type DraftPanel = { id: number; typeKey: string; size: PanelSize; config: Record<string, unknown> };
export type DraftGroup = { key: string; panels: DraftPanel[] };
export type DraftSettings = { pins_order: PinOrder; history_count: number };

export type Draft = {
  pins: DraftPin[];
  groups: DraftGroup[];
  settings: DraftSettings;
  // pt-BR summary of each change in order; becomes activity_log.details.
  changes: string[];
  // Next temporary id for a new pin or panel. Temporary ids are negative; the database assigns real ones.
  nextId: number;
};

export type DraftResult = DataResult<Draft>;

const PIN_NOT_FOUND = "Atalho não encontrado.";
const PANEL_NOT_FOUND = "Painel não encontrado.";

export function draftFromLayout(layout: Layout, settings: DraftSettings): Draft {
  const groups = layout.groups
    .map((g) => ({
      key: g.groupKey,
      panels: layout.panels
        .filter((p) => p.groupKey === g.groupKey)
        .sort((a, b) => a.position - b.position)
        .map(({ id, typeKey, size, config }) => ({ id, typeKey, size, config })),
    }))
    .filter((g) => g.panels.length > 0);
  return {
    pins: [...layout.pins].sort((a, b) => a.position - b.position).map(({ id, label, icon, href }) => ({ id, label, icon, href })),
    groups,
    settings: { ...settings },
    changes: [],
    nextId: -1,
  };
}

function changed(d: Draft, next: Partial<Draft>, change: string): DraftResult {
  return { ok: true, data: { ...d, ...next, changes: [...d.changes, change] } };
}

// Moves the item at `from` to `to`, shifting the items in between (same as drag and drop).
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function panelName(panel: Pick<DraftPanel, "typeKey" | "config">): string {
  return panelType(panel.typeKey)?.nameOf(panel.config) ?? panel.typeKey;
}

// ---------- pins ----------

export function addPin(d: Draft, input: unknown): DraftResult {
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  if (d.pins.length >= PIN_MAX) return fail(PIN_CAP_MESSAGE);
  return changed(
    d,
    { pins: [...d.pins, { id: d.nextId, ...parsed.data }], nextId: d.nextId - 1 },
    `Atalho “${parsed.data.label}” fixado`,
  );
}

export function updatePin(d: Draft, id: number, input: unknown): DraftResult {
  const pin = d.pins.find((p) => p.id === id);
  if (!pin) return fail(PIN_NOT_FOUND);
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const { label, icon, href } = parsed.data;
  if (pin.label === label && pin.icon === icon && pin.href === href) return { ok: true, data: d };
  return changed(d, { pins: d.pins.map((p) => (p.id === id ? { id, ...parsed.data } : p)) }, `Atalho “${label}” alterado`);
}

export function removePin(d: Draft, id: number): DraftResult {
  const pin = d.pins.find((p) => p.id === id);
  if (!pin) return fail(PIN_NOT_FOUND);
  return changed(d, { pins: d.pins.filter((p) => p.id !== id) }, `Atalho “${pin.label}” removido`);
}

export function movePin(d: Draft, from: number, to: number): DraftResult {
  const pin = d.pins[from];
  if (!pin || to < 0 || to >= d.pins.length) return fail(PIN_NOT_FOUND);
  if (from === to) return { ok: true, data: d };
  return changed(d, { pins: moveItem(d.pins, from, to) }, `Atalho “${pin.label}” movido`);
}

// ---------- panels and groups ----------

export function addPanel(d: Draft, input: unknown): DraftResult {
  const parsed = newPanelSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const type = panelType(parsed.data.typeKey);
  if (!type) return fail("Tipo de painel desconhecido.");
  if (!type.sizes.includes(parsed.data.size)) return fail("Este painel não tem esse tamanho.");
  if (type.single && d.groups.some((g) => g.panels.some((p) => p.typeKey === type.key))) {
    return fail("Este painel já está no início.");
  }
  const config = type.config.safeParse(parsed.data.config);
  if (!config.success) return fail(firstMessage(config.error));
  const panel: DraftPanel = { id: d.nextId, typeKey: type.key, size: parsed.data.size, config: config.data };
  const exists = d.groups.some((g) => g.key === type.feature);
  const groups = exists
    ? d.groups.map((g) => (g.key === type.feature ? { ...g, panels: [...g.panels, panel] } : g))
    : [...d.groups, { key: type.feature, panels: [panel] }];
  return changed(d, { groups, nextId: d.nextId - 1 }, `Painel “${type.nameOf(config.data)}” adicionado`);
}

function findPanel(d: Draft, id: number): DraftPanel | undefined {
  for (const g of d.groups) {
    const panel = g.panels.find((p) => p.id === id);
    if (panel) return panel;
  }
  return undefined;
}

export function updatePanel(d: Draft, id: number, update: unknown): DraftResult {
  const panel = findPanel(d, id);
  const type = panel && panelType(panel.typeKey);
  if (!panel || !type) return fail(PANEL_NOT_FOUND);
  const parsed = panelUpdateSchema.safeParse(update);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const size = parsed.data.size ?? panel.size;
  if (!type.sizes.includes(size)) return fail("Este painel não tem esse tamanho.");
  let config = panel.config;
  if (parsed.data.config) {
    const c = type.config.safeParse({ ...panel.config, ...parsed.data.config });
    if (!c.success) return fail(firstMessage(c.error));
    config = c.data;
  }
  const configChanged = JSON.stringify(config) !== JSON.stringify(panel.config);
  if (size === panel.size && !configChanged) return { ok: true, data: d };
  const name = type.nameOf(config);
  const summary = configChanged ? `Painel “${name}” alterado` : `Painel “${name}” agora é ${SIZE_LABELS[size].toLowerCase()}`;
  const groups = d.groups.map((g) => ({ ...g, panels: g.panels.map((p) => (p.id === id ? { ...p, size, config } : p)) }));
  return changed(d, { groups }, summary);
}

// A group left without panels is dropped from the draft; it is added again at the end if a panel returns.
export function removePanel(d: Draft, id: number): DraftResult {
  const panel = findPanel(d, id);
  if (!panel) return fail(PANEL_NOT_FOUND);
  const groups = d.groups
    .map((g) => ({ ...g, panels: g.panels.filter((p) => p.id !== id) }))
    .filter((g) => g.panels.length > 0);
  return changed(d, { groups }, `Painel “${panelName(panel)}” removido`);
}

export function movePanel(d: Draft, groupKey: string, from: number, to: number): DraftResult {
  const group = d.groups.find((g) => g.key === groupKey);
  const panel = group?.panels[from];
  if (!group || !panel || to < 0 || to >= group.panels.length) return fail(PANEL_NOT_FOUND);
  if (from === to) return { ok: true, data: d };
  const groups = d.groups.map((g) => (g.key === groupKey ? { ...g, panels: moveItem(g.panels, from, to) } : g));
  return changed(d, { groups }, `Painel “${panelName(panel)}” movido`);
}

export function moveGroup(d: Draft, from: number, to: number, groupName: string): DraftResult {
  if (!d.groups[from] || to < 0 || to >= d.groups.length) return fail("Grupo não encontrado.");
  if (from === to) return { ok: true, data: d };
  return changed(d, { groups: moveItem(d.groups, from, to) }, `Grupo “${groupName}” movido`);
}

// ---------- settings that belong to the session ----------

export function setPinsOrder(d: Draft, order: PinOrder): DraftResult {
  if (d.settings.pins_order === order) return { ok: true, data: d };
  return changed(
    d,
    { settings: { ...d.settings, pins_order: order } },
    order === "usage" ? "Ordenar pelos mais usados ligado" : "Ordenar pelos mais usados desligado",
  );
}

export function setHistoryCount(d: Draft, count: number): DraftResult {
  if (!Number.isInteger(count) || count < HISTORY_COUNT_MIN || count > HISTORY_COUNT_MAX) {
    return fail(`Escolha de ${HISTORY_COUNT_MIN} a ${HISTORY_COUNT_MAX} itens.`);
  }
  if (d.settings.history_count === count) return { ok: true, data: d };
  return changed(d, { settings: { ...d.settings, history_count: count } }, `Itens do histórico no início: ${count}`);
}

// What Concluir sends to the server.
export function sessionPayload(d: Draft) {
  return { pins: d.pins, groups: d.groups, settings: d.settings, changes: d.changes };
}
