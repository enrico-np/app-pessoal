import { asc, desc, eq, gt, lt, sql } from "drizzle-orm";
import type { Db } from "@/db/types";
import { menuBlocks, type MenuBlockRow } from "./schema";
import { configSchema, type BlockUpdate, type NewBlock } from "./validation";

// Plain query functions. No connection() here: pages must read through data.ts (see CLAUDE.md).
// Writes run in transactions. `position` has a unique index, so moves and gap-closing
// pass through negative temporary values instead of updating rows in place.

export function listBlocks(db: Db): MenuBlockRow[] {
  return db.select().from(menuBlocks).orderBy(asc(menuBlocks.position)).all();
}

export function getBlock(db: Db, id: number): MenuBlockRow | undefined {
  return db.select().from(menuBlocks).where(eq(menuBlocks.id, id)).get();
}

// Input must already be parsed with newBlockSchema. The block goes to the end of the menu.
export function addBlock(db: Db, input: NewBlock): MenuBlockRow {
  return db.transaction((tx) => {
    const last = tx
      .select({ position: menuBlocks.position })
      .from(menuBlocks)
      .orderBy(desc(menuBlocks.position))
      .limit(1)
      .get();
    return tx
      .insert(menuBlocks)
      .values({ ...input, position: last ? last.position + 1 : 0 })
      .returning()
      .get();
  });
}

// Update must already be parsed with blockUpdateSchema. Config is checked here because
// the valid shape depends on the stored type. Throws ZodError on invalid config.
export function updateBlock(
  db: Db,
  id: number,
  update: BlockUpdate,
  cardKeys: readonly string[],
): MenuBlockRow | undefined {
  return db.transaction((tx) => {
    const block = tx.select().from(menuBlocks).where(eq(menuBlocks.id, id)).get();
    if (!block) return undefined;
    const values: Partial<MenuBlockRow> = {};
    if (update.label !== undefined) values.label = update.label;
    if (update.icon !== undefined) values.icon = update.icon;
    if (update.size !== undefined) values.size = update.size;
    if (update.config !== undefined) values.config = configSchema(block.type, cardKeys).parse(update.config);
    if (Object.keys(values).length === 0) return block;
    return tx.update(menuBlocks).set(values).where(eq(menuBlocks.id, id)).returning().get();
  });
}

// Removes the block and shifts later blocks down by one so positions stay 0..n-1.
export function removeBlock(db: Db, id: number): boolean {
  return db.transaction((tx) => {
    const block = tx.select().from(menuBlocks).where(eq(menuBlocks.id, id)).get();
    if (!block) return false;
    tx.delete(menuBlocks).where(eq(menuBlocks.id, id)).run();
    // Two steps: p -> -p, then -p -> p - 1. A single "p - 1" update could hit the unique index mid-statement.
    tx.update(menuBlocks)
      .set({ position: sql`-${menuBlocks.position}` })
      .where(gt(menuBlocks.position, block.position))
      .run();
    tx.update(menuBlocks)
      .set({ position: sql`-${menuBlocks.position} - 1` })
      .where(lt(menuBlocks.position, 0))
      .run();
    return true;
  });
}

// Swaps the block with its neighbor. Returns false if the block does not exist or is already at that end.
export function moveBlock(db: Db, id: number, direction: "earlier" | "later"): boolean {
  return db.transaction((tx) => {
    const block = tx.select().from(menuBlocks).where(eq(menuBlocks.id, id)).get();
    if (!block) return false;
    const neighbor = tx
      .select()
      .from(menuBlocks)
      .where(
        direction === "earlier"
          ? lt(menuBlocks.position, block.position)
          : gt(menuBlocks.position, block.position),
      )
      .orderBy(direction === "earlier" ? desc(menuBlocks.position) : asc(menuBlocks.position))
      .limit(1)
      .get();
    if (!neighbor) return false;
    tx.update(menuBlocks).set({ position: -1 }).where(eq(menuBlocks.id, block.id)).run();
    tx.update(menuBlocks).set({ position: block.position }).where(eq(menuBlocks.id, neighbor.id)).run();
    tx.update(menuBlocks).set({ position: neighbor.position }).where(eq(menuBlocks.id, block.id)).run();
    return true;
  });
}

// Adds delta to a counter block's value. Returns the new value, or undefined if the block is not a counter.
export function changeCounter(db: Db, id: number, delta: number): number | undefined {
  if (!Number.isInteger(delta)) throw new Error("delta must be an integer");
  return db.transaction((tx) => {
    const block = tx.select().from(menuBlocks).where(eq(menuBlocks.id, id)).get();
    if (!block || block.type !== "counter") return undefined;
    const current = typeof block.config.value === "number" ? block.config.value : 0;
    const value = current + delta;
    tx.update(menuBlocks).set({ config: { ...block.config, value } }).where(eq(menuBlocks.id, id)).run();
    return value;
  });
}
