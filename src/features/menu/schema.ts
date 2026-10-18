import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const BLOCK_TYPES = ["shortcut", "note", "counter", "card"] as const;
export const BLOCK_SIZES = ["sm", "md", "lg"] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];
export type BlockSize = (typeof BLOCK_SIZES)[number];

export const menuBlocks = sqliteTable(
  "menu_blocks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", { enum: BLOCK_TYPES }).notNull(),
    label: text("label").notNull(),
    icon: text("icon"),
    size: text("size", { enum: BLOCK_SIZES }).notNull().default("sm"),
    // Unique so two blocks can never share a slot; moves swap through a temporary value.
    position: integer("position").notNull(),
    // JSON validated per type in validation.ts before every write.
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("menu_blocks_position_unique").on(t.position)],
);

export type MenuBlockRow = typeof menuBlocks.$inferSelect;
