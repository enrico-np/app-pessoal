import { z } from "zod";
import type { Db } from "@/db/types";
import { logActivity } from "@/features/activity/log";
import { setSetting } from "@/features/settings/queries";
import { formatInteger } from "@/lib/format";
import { fail, firstMessage, type ActionResult } from "@/lib/result";
import { panelType } from "./panel-types";
import { getPanel, replaceLayout, updatePanel, type SavedGroup } from "./queries";
import { editSessionSchema, idSchema, PIN_CAP_MESSAGE, PIN_MAX } from "./validation";

// Validation + write for each Server Action, without Next.js APIs, so tests can call them.

const PANEL_NOT_FOUND = "Painel não encontrado.";

export function sessionSummary(changeCount: number): string {
  return `Início editado · ${formatInteger(changeCount)} ${changeCount === 1 ? "mudança" : "mudanças"}`;
}

// Concluir in edit mode (spec 003): writes the final layout and the session's settings in one transaction
// and records one Histórico entry listing every change. The client validated each step already; this
// repeats every rule because the payload comes from the browser.
export function saveEditSessionMutation(db: Db, input: unknown): ActionResult {
  const parsed = editSessionSchema.safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  const { pins, settings, changes } = parsed.data;
  if (pins.length > PIN_MAX) return fail(PIN_CAP_MESSAGE);

  const seenGroups = new Set<string>();
  const seenSingle = new Set<string>();
  const groups: SavedGroup[] = [];
  for (const group of parsed.data.groups) {
    if (seenGroups.has(group.key)) return fail("Grupo repetido.");
    seenGroups.add(group.key);
    const panels: SavedGroup["panels"] = [];
    for (const panel of group.panels) {
      const type = panelType(panel.typeKey);
      if (!type || type.feature !== group.key) return fail("Tipo de painel desconhecido.");
      if (!type.sizes.includes(panel.size)) return fail("Este painel não tem esse tamanho.");
      if (type.single) {
        if (seenSingle.has(type.key)) return fail("Este painel já está no início.");
        seenSingle.add(type.key);
      }
      const config = type.config.safeParse(panel.config);
      if (!config.success) return fail(firstMessage(config.error));
      panels.push({ id: panel.id > 0 ? panel.id : undefined, typeKey: type.key, size: panel.size, config: config.data });
    }
    if (panels.length > 0) groups.push({ key: group.key, panels });
  }

  db.transaction((tx) => {
    replaceLayout(
      tx,
      pins.map((p) => ({ ...p, id: p.id > 0 ? p.id : undefined })),
      groups,
    );
    setSetting(tx, "pins_order", settings.pins_order);
    setSetting(tx, "history_count", settings.history_count);
    logActivity(tx, { featureKey: "home", action: "home.edited", summary: sessionSummary(changes.length), details: changes });
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
