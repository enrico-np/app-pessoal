import { and, asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import type { Db } from "@/db/types";
import {
  homeGroups,
  homePanels,
  homePins,
  type HomeGroupRow,
  type HomePanelRow,
  type HomePinRow,
  type PanelSize,
} from "./schema";
import type { Direction, PinInput } from "./validation";

// Plain query functions. Pages read through data.ts (see CLAUDE.md). Inputs must already be validated.
// Positions have unique indexes, so moves and gap-closing pass through negative temporary values.

export type Layout = { pins: HomePinRow[]; panels: HomePanelRow[]; groups: HomeGroupRow[] };

// ---------- pins ----------

export function listPins(db: Db): HomePinRow[] {
  return db.select().from(homePins).orderBy(asc(homePins.position)).all();
}

export function getPin(db: Db, id: number): HomePinRow | undefined {
  return db.select().from(homePins).where(eq(homePins.id, id)).get();
}

export function addPin(db: Db, input: PinInput): HomePinRow {
  return db.transaction((tx) => {
    const last = tx.select({ p: homePins.position }).from(homePins).orderBy(desc(homePins.position)).limit(1).get();
    return tx
      .insert(homePins)
      .values({ ...input, position: last ? last.p + 1 : 0 })
      .returning()
      .get();
  });
}

export function updatePin(db: Db, id: number, input: PinInput): HomePinRow | undefined {
  return db.update(homePins).set(input).where(eq(homePins.id, id)).returning().get();
}

export function removePin(db: Db, id: number): HomePinRow | undefined {
  return db.transaction((tx) => {
    const pin = tx.select().from(homePins).where(eq(homePins.id, id)).get();
    if (!pin) return undefined;
    tx.delete(homePins).where(eq(homePins.id, id)).run();
    tx.update(homePins)
      .set({ position: sql`-${homePins.position}` })
      .where(gt(homePins.position, pin.position))
      .run();
    tx.update(homePins)
      .set({ position: sql`-${homePins.position} - 1` })
      .where(lt(homePins.position, 0))
      .run();
    return pin;
  });
}

export function movePin(db: Db, id: number, direction: Direction): boolean {
  return db.transaction((tx) => {
    const pin = tx.select().from(homePins).where(eq(homePins.id, id)).get();
    if (!pin) return false;
    const neighbor = tx
      .select()
      .from(homePins)
      .where(direction === "earlier" ? lt(homePins.position, pin.position) : gt(homePins.position, pin.position))
      .orderBy(direction === "earlier" ? desc(homePins.position) : asc(homePins.position))
      .limit(1)
      .get();
    if (!neighbor) return false;
    tx.update(homePins).set({ position: -1 }).where(eq(homePins.id, pin.id)).run();
    tx.update(homePins).set({ position: pin.position }).where(eq(homePins.id, neighbor.id)).run();
    tx.update(homePins).set({ position: neighbor.position }).where(eq(homePins.id, pin.id)).run();
    return true;
  });
}

// Manual order with ties broken by position; "usage" sorts by open count (desc), then position.
export function sortPinsByUsage(pins: HomePinRow[], counts: Map<string, number>): HomePinRow[] {
  return [...pins].sort((a, b) => (counts.get(b.href) ?? 0) - (counts.get(a.href) ?? 0) || a.position - b.position);
}

// ---------- groups and panels ----------

export function listGroups(db: Db): HomeGroupRow[] {
  return db.select().from(homeGroups).orderBy(asc(homeGroups.position)).all();
}

// Panels ordered by their group's position, then by position inside the group.
export function listPanels(db: Db): HomePanelRow[] {
  const groupOrder = new Map(listGroups(db).map((g) => [g.groupKey, g.position]));
  const panels = db.select().from(homePanels).all();
  return panels.sort(
    (a, b) =>
      (groupOrder.get(a.groupKey) ?? Number.MAX_SAFE_INTEGER) - (groupOrder.get(b.groupKey) ?? Number.MAX_SAFE_INTEGER) ||
      a.position - b.position,
  );
}

export function getPanel(db: Db, id: number): HomePanelRow | undefined {
  return db.select().from(homePanels).where(eq(homePanels.id, id)).get();
}

export function countPanelsOfType(db: Db, typeKey: string): number {
  return db.select().from(homePanels).where(eq(homePanels.typeKey, typeKey)).all().length;
}

export function addPanel(
  db: Db,
  input: { typeKey: string; groupKey: string; size: PanelSize; config: Record<string, unknown> },
): HomePanelRow {
  return db.transaction((tx) => {
    const group = tx.select().from(homeGroups).where(eq(homeGroups.groupKey, input.groupKey)).get();
    if (!group) {
      const lastGroup = tx
        .select({ p: homeGroups.position })
        .from(homeGroups)
        .orderBy(desc(homeGroups.position))
        .limit(1)
        .get();
      tx.insert(homeGroups)
        .values({ groupKey: input.groupKey, position: lastGroup ? lastGroup.p + 1 : 0 })
        .run();
    }
    const last = tx
      .select({ p: homePanels.position })
      .from(homePanels)
      .where(eq(homePanels.groupKey, input.groupKey))
      .orderBy(desc(homePanels.position))
      .limit(1)
      .get();
    return tx
      .insert(homePanels)
      .values({ ...input, position: last ? last.p + 1 : 0 })
      .returning()
      .get();
  });
}

export function updatePanel(
  db: Db,
  id: number,
  values: { size?: PanelSize; config?: Record<string, unknown> },
): HomePanelRow | undefined {
  if (values.size === undefined && values.config === undefined) return getPanel(db, id);
  return db.update(homePanels).set(values).where(eq(homePanels.id, id)).returning().get();
}

export function removePanel(db: Db, id: number): HomePanelRow | undefined {
  return db.transaction((tx) => {
    const panel = tx.select().from(homePanels).where(eq(homePanels.id, id)).get();
    if (!panel) return undefined;
    tx.delete(homePanels).where(eq(homePanels.id, id)).run();
    const inGroup = eq(homePanels.groupKey, panel.groupKey);
    tx.update(homePanels)
      .set({ position: sql`-${homePanels.position}` })
      .where(and(inGroup, gt(homePanels.position, panel.position)))
      .run();
    tx.update(homePanels)
      .set({ position: sql`-${homePanels.position} - 1` })
      .where(and(inGroup, lt(homePanels.position, 0)))
      .run();
    return panel;
  });
}

export function movePanel(db: Db, id: number, direction: Direction): boolean {
  return db.transaction((tx) => {
    const panel = tx.select().from(homePanels).where(eq(homePanels.id, id)).get();
    if (!panel) return false;
    const inGroup = eq(homePanels.groupKey, panel.groupKey);
    const neighbor = tx
      .select()
      .from(homePanels)
      .where(
        and(
          inGroup,
          direction === "earlier" ? lt(homePanels.position, panel.position) : gt(homePanels.position, panel.position),
        ),
      )
      .orderBy(direction === "earlier" ? desc(homePanels.position) : asc(homePanels.position))
      .limit(1)
      .get();
    if (!neighbor) return false;
    tx.update(homePanels).set({ position: -1 }).where(eq(homePanels.id, panel.id)).run();
    tx.update(homePanels).set({ position: panel.position }).where(eq(homePanels.id, neighbor.id)).run();
    tx.update(homePanels).set({ position: neighbor.position }).where(eq(homePanels.id, panel.id)).run();
    return true;
  });
}

// Moves a group past the nearest group that has panels, so empty groups never block a move.
export function moveGroup(db: Db, groupKey: string, direction: Direction): boolean {
  return db.transaction((tx) => {
    const withPanels = new Set(
      tx
        .selectDistinct({ k: homePanels.groupKey })
        .from(homePanels)
        .all()
        .map((r) => r.k),
    );
    const groups = tx.select().from(homeGroups).orderBy(asc(homeGroups.position)).all();
    const visible = groups.filter((g) => withPanels.has(g.groupKey));
    const i = visible.findIndex((g) => g.groupKey === groupKey);
    const j = direction === "earlier" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= visible.length) return false;
    const a = visible[i];
    const b = visible[j];
    tx.update(homeGroups).set({ position: -1 }).where(eq(homeGroups.groupKey, a.groupKey)).run();
    tx.update(homeGroups).set({ position: a.position }).where(eq(homeGroups.groupKey, b.groupKey)).run();
    tx.update(homeGroups).set({ position: b.position }).where(eq(homeGroups.groupKey, a.groupKey)).run();
    return true;
  });
}

// ---------- layout snapshots (undo/redo) ----------

export function getLayout(db: Db): Layout {
  return { pins: listPins(db), panels: listPanels(db), groups: listGroups(db) };
}

// Replaces pins, panels and groups with the snapshot, keeping ids. Panel config is restored too,
// so a counter changed outside edit mode after the snapshot goes back to the snapshot value.
export function restoreLayout(db: Db, layout: Layout): void {
  db.transaction((tx) => {
    tx.delete(homePins).run();
    tx.delete(homePanels).run();
    tx.delete(homeGroups).run();
    if (layout.pins.length) tx.insert(homePins).values(layout.pins).run();
    if (layout.groups.length) tx.insert(homeGroups).values(layout.groups).run();
    if (layout.panels.length) tx.insert(homePanels).values(layout.panels).run();
  });
}
