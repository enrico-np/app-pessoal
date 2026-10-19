import { z } from "zod";
import type { Db } from "@/db/types";
import { logActivity } from "@/features/activity/log";
import { formatInteger } from "@/lib/format";
import { fail, firstMessage, type ActionResult, type DataResult } from "@/lib/result";
import { panelType, SIZE_LABELS } from "./panel-types";
import {
  addPanel,
  addPin,
  countPanelsOfType,
  getLayout,
  getPanel,
  getPin,
  listPins,
  moveGroup,
  movePanel,
  movePin,
  removePanel,
  removePin,
  restoreLayout,
  updatePanel,
  updatePin,
  type Layout,
} from "./queries";
import {
  directionSchema,
  idSchema,
  layoutSchema,
  newPanelSchema,
  panelUpdateSchema,
  pinSchema,
  PIN_MAX,
} from "./validation";

// Validation + query + history entry for each write, without Next.js APIs, so tests can call them.
// Edit-mode writes return the layout before and after, which the client keeps for undo/redo.

export type EditChange = { label: string; before: Layout; after: Layout };
export type EditResult = DataResult<EditChange>;

const PANEL_NOT_FOUND = "Painel não encontrado.";
const PIN_NOT_FOUND = "Atalho não encontrado.";

// Runs a change and, if it succeeds, records it in the activity log with the given summary.
function edit(db: Db, action: string, run: () => string | { summary: string }): EditResult {
  const before = getLayout(db);
  const outcome = run();
  if (typeof outcome === "string") return fail(outcome);
  logActivity(db, { featureKey: "home", action, summary: outcome.summary, targetHref: "/" });
  return { ok: true, data: { label: outcome.summary, before, after: getLayout(db) } };
}

// ---------- pins ----------

export function addPinMutation(db: Db, input: unknown): EditResult {
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  if (listPins(db).length >= PIN_MAX) return fail(`Você já fixou ${PIN_MAX} atalhos. Remova um para fixar outro.`);
  return edit(db, "pin.added", () => {
    addPin(db, parsed.data);
    return { summary: `Atalho “${parsed.data.label}” fixado` };
  });
}

export function updatePinMutation(db: Db, pinId: unknown, input: unknown): EditResult {
  const id = idSchema.safeParse(pinId);
  if (!id.success) return fail(PIN_NOT_FOUND);
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  return edit(db, "pin.changed", () =>
    updatePin(db, id.data, parsed.data) ? { summary: `Atalho “${parsed.data.label}” alterado` } : PIN_NOT_FOUND,
  );
}

export function removePinMutation(db: Db, pinId: unknown): EditResult {
  const id = idSchema.safeParse(pinId);
  if (!id.success) return fail(PIN_NOT_FOUND);
  return edit(db, "pin.removed", () => {
    const pin = removePin(db, id.data);
    return pin ? { summary: `Atalho “${pin.label}” removido` } : PIN_NOT_FOUND;
  });
}

export function movePinMutation(db: Db, pinId: unknown, direction: unknown): EditResult {
  const id = idSchema.safeParse(pinId);
  const dir = directionSchema.safeParse(direction);
  if (!id.success || !dir.success) return fail(PIN_NOT_FOUND);
  const pin = getPin(db, id.data);
  if (!pin) return fail(PIN_NOT_FOUND);
  return edit(db, "pin.moved", () =>
    movePin(db, id.data, dir.data) ? { summary: `Atalho “${pin.label}” movido` } : "Este atalho já está na ponta.",
  );
}

// ---------- panels ----------

export function addPanelMutation(db: Db, input: unknown): EditResult {
  const parsed = newPanelSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const type = panelType(parsed.data.typeKey);
  if (!type) return fail("Tipo de painel desconhecido.");
  if (!type.sizes.includes(parsed.data.size)) return fail("Este painel não tem esse tamanho.");
  if (type.single && countPanelsOfType(db, type.key) > 0) return fail("Este painel já está no início.");
  const config = type.config.safeParse(parsed.data.config);
  if (!config.success) return fail(firstMessage(config.error));
  return edit(db, "panel.added", () => {
    addPanel(db, { typeKey: type.key, groupKey: type.feature, size: parsed.data.size, config: config.data });
    return { summary: `Painel “${type.nameOf(config.data)}” adicionado` };
  });
}

export function updatePanelMutation(db: Db, panelId: unknown, update: unknown): EditResult {
  const id = idSchema.safeParse(panelId);
  if (!id.success) return fail(PANEL_NOT_FOUND);
  const parsed = panelUpdateSchema.safeParse(update);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const panel = getPanel(db, id.data);
  const type = panel && panelType(panel.typeKey);
  if (!panel || !type) return fail(PANEL_NOT_FOUND);
  if (parsed.data.size && !type.sizes.includes(parsed.data.size)) return fail("Este painel não tem esse tamanho.");
  let config: Record<string, unknown> | undefined;
  if (parsed.data.config) {
    const c = type.config.safeParse({ ...panel.config, ...parsed.data.config });
    if (!c.success) return fail(firstMessage(c.error));
    config = c.data;
  }
  return edit(db, "panel.changed", () => {
    updatePanel(db, panel.id, { size: parsed.data.size, config });
    const name = type.nameOf(config ?? panel.config);
    const summary =
      parsed.data.size && parsed.data.size !== panel.size && !config
        ? `Painel “${name}” agora é ${SIZE_LABELS[parsed.data.size].toLowerCase()}`
        : `Painel “${name}” alterado`;
    return { summary };
  });
}

export function removePanelMutation(db: Db, panelId: unknown): EditResult {
  const id = idSchema.safeParse(panelId);
  if (!id.success) return fail(PANEL_NOT_FOUND);
  return edit(db, "panel.removed", () => {
    const panel = removePanel(db, id.data);
    if (!panel) return PANEL_NOT_FOUND;
    return { summary: `Painel “${panelType(panel.typeKey)?.nameOf(panel.config) ?? panel.typeKey}” removido` };
  });
}

export function movePanelMutation(db: Db, panelId: unknown, direction: unknown): EditResult {
  const id = idSchema.safeParse(panelId);
  const dir = directionSchema.safeParse(direction);
  if (!id.success || !dir.success) return fail(PANEL_NOT_FOUND);
  const panel = getPanel(db, id.data);
  if (!panel) return fail(PANEL_NOT_FOUND);
  const name = panelType(panel.typeKey)?.nameOf(panel.config) ?? panel.typeKey;
  return edit(db, "panel.moved", () =>
    movePanel(db, panel.id, dir.data) ? { summary: `Painel “${name}” movido` } : "Este painel já está na ponta.",
  );
}

export function moveGroupMutation(db: Db, groupKey: unknown, direction: unknown, groupName: string): EditResult {
  const key = z.string().min(1).safeParse(groupKey);
  const dir = directionSchema.safeParse(direction);
  if (!key.success || !dir.success) return fail("Grupo não encontrado.");
  return edit(db, "group.moved", () =>
    moveGroup(db, key.data, dir.data) ? { summary: `Grupo “${groupName}” movido` } : "Este grupo já está na ponta.",
  );
}

// Undo and redo send back a snapshot the server produced earlier. It is validated again before writing.
export function restoreLayoutMutation(db: Db, layout: unknown, kind: "undo" | "redo"): ActionResult {
  const parsed = layoutSchema.safeParse(layout);
  if (!parsed.success) return fail("Não foi possível desfazer esta mudança.");
  for (const panel of parsed.data.panels) {
    const type = panelType(panel.typeKey);
    if (!type || !type.sizes.includes(panel.size)) return fail("Não foi possível desfazer esta mudança.");
  }
  restoreLayout(db, parsed.data);
  logActivity(db, {
    featureKey: "home",
    action: kind === "undo" ? "layout.undo" : "layout.redo",
    summary: kind === "undo" ? "Mudança no início desfeita" : "Mudança no início refeita",
    targetHref: "/",
  });
  return { ok: true };
}

// ---------- normal mode ----------

export function changeCounterMutation(db: Db, panelId: unknown, delta: unknown): ActionResult {
  const id = idSchema.safeParse(panelId);
  const d = z.union([z.literal(1), z.literal(-1)]).safeParse(delta);
  if (!id.success || !d.success) return fail(PANEL_NOT_FOUND);
  const panel = getPanel(db, id.data);
  const type = panel && panelType(panel.typeKey);
  if (!panel || !type || panel.typeKey !== "general.counter") return fail(PANEL_NOT_FOUND);
  const current = typeof panel.config.value === "number" ? panel.config.value : 0;
  const value = current + d.data;
  updatePanel(db, panel.id, { config: { ...panel.config, value } });
  logActivity(db, {
    featureKey: "general",
    action: "counter.changed",
    summary: `${type.nameOf(panel.config)}: ${formatInteger(current)} → ${formatInteger(value)}`,
    targetHref: "/",
  });
  return { ok: true };
}
