import { asc, eq } from "drizzle-orm";
import type { DbOrTx } from "@/db/types";
import {
  homeGroups,
  homePanels,
  homePins,
  type HomeGroupRow,
  type HomePanelRow,
  type HomePinRow,
  type PanelSize,
} from "./schema";

// Plain query functions. Pages read through data.ts (see CLAUDE.md). Inputs must already be validated.

export type Layout = { pins: HomePinRow[]; panels: HomePanelRow[]; groups: HomeGroupRow[] };

// ---------- pins ----------

export function listPins(db: DbOrTx): HomePinRow[] {
  return db.select().from(homePins).orderBy(asc(homePins.position)).all();
}

// "usage" order: tap count (desc), ties by manual position.
export function sortPinsByUsage(pins: HomePinRow[], counts: Map<string, number>): HomePinRow[] {
  return [...pins].sort((a, b) => (counts.get(b.href) ?? 0) - (counts.get(a.href) ?? 0) || a.position - b.position);
}

// ---------- groups and panels ----------

export function listGroups(db: DbOrTx): HomeGroupRow[] {
  return db.select().from(homeGroups).orderBy(asc(homeGroups.position)).all();
}

// Panels ordered by their group's position, then by position inside the group.
export function listPanels(db: DbOrTx): HomePanelRow[] {
  const groupOrder = new Map(listGroups(db).map((g) => [g.groupKey, g.position]));
  const panels = db.select().from(homePanels).all();
  return panels.sort(
    (a, b) =>
      (groupOrder.get(a.groupKey) ?? Number.MAX_SAFE_INTEGER) - (groupOrder.get(b.groupKey) ?? Number.MAX_SAFE_INTEGER) ||
      a.position - b.position,
  );
}

export function getPanel(db: DbOrTx, id: number): HomePanelRow | undefined {
  return db.select().from(homePanels).where(eq(homePanels.id, id)).get();
}

// Used by the counter outside edit mode.
export function updatePanel(
  db: DbOrTx,
  id: number,
  values: { size?: PanelSize; config?: Record<string, unknown> },
): HomePanelRow | undefined {
  if (values.size === undefined && values.config === undefined) return getPanel(db, id);
  return db.update(homePanels).set(values).where(eq(homePanels.id, id)).returning().get();
}

export function getLayout(db: DbOrTx): Layout {
  return { pins: listPins(db), panels: listPanels(db), groups: listGroups(db) };
}

// ---------- edit session ----------

export type SavedPin = { id?: number; label: string; icon: string; href: string };
export type SavedPanel = { id?: number; typeKey: string; size: PanelSize; config: Record<string, unknown> };
export type SavedGroup = { key: string; panels: SavedPanel[] };

// Replaces pins, panels and groups with the given lists, in list order. Rows that keep their id keep their
// created_at; rows without an id are inserted with a new one. Call inside a transaction.
export function replaceLayout(db: DbOrTx, pins: SavedPin[], groups: SavedGroup[]): void {
  const pinCreated = new Map(listPins(db).map((p) => [p.id, p.createdAt]));
  const panelCreated = new Map(
    db
      .select({ id: homePanels.id, createdAt: homePanels.createdAt })
      .from(homePanels)
      .all()
      .map((p) => [p.id, p.createdAt]),
  );
  const now = new Date();
  db.delete(homePins).run();
  db.delete(homePanels).run();
  db.delete(homeGroups).run();
  pins.forEach((p, position) => {
    const keep = p.id !== undefined && pinCreated.has(p.id);
    db.insert(homePins)
      .values({
        ...(keep ? { id: p.id } : {}),
        label: p.label,
        icon: p.icon,
        href: p.href,
        position,
        createdAt: (keep && pinCreated.get(p.id!)) || now,
      })
      .run();
  });
  groups.forEach((g, groupPosition) => {
    db.insert(homeGroups).values({ groupKey: g.key, position: groupPosition }).run();
    g.panels.forEach((p, position) => {
      const keep = p.id !== undefined && panelCreated.has(p.id);
      db.insert(homePanels)
        .values({
          ...(keep ? { id: p.id } : {}),
          typeKey: p.typeKey,
          groupKey: g.key,
          size: p.size,
          position,
          config: p.config,
          createdAt: (keep && panelCreated.get(p.id!)) || now,
        })
        .run();
    });
  });
}
