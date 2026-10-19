import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const PANEL_SIZES = ["sm", "md", "lg"] as const;
export type PanelSize = (typeof PANEL_SIZES)[number];

// Shortcuts in the Fixados row (spec 002). The cap of 6 is enforced in mutations.ts.
export const homePins = sqliteTable(
  "home_pins",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    label: text("label").notNull(),
    // Key from ICON_NAMES in src/components/ui/Icon.tsx.
    icon: text("icon").notNull(),
    href: text("href").notNull(),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("home_pins_position_unique").on(t.position)],
);

// One row per panel on Início. type_key points at a panel type in panels.ts; group_key is that type's feature.
export const homePanels = sqliteTable(
  "home_panels",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    typeKey: text("type_key").notNull(),
    groupKey: text("group_key").notNull(),
    size: text("size", { enum: PANEL_SIZES }).notNull(),
    // Order inside the group. Unique per group; moves swap through a temporary negative value.
    position: integer("position").notNull(),
    // JSON validated per panel type before every write.
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex("home_panels_group_position_unique").on(t.groupKey, t.position)],
);

// Order of the groups on Início. A row exists for every group that ever had a panel.
export const homeGroups = sqliteTable(
  "home_groups",
  {
    groupKey: text("group_key").primaryKey(),
    position: integer("position").notNull(),
  },
  (t) => [uniqueIndex("home_groups_position_unique").on(t.position)],
);

export type HomePinRow = typeof homePins.$inferSelect;
export type HomePanelRow = typeof homePanels.$inferSelect;
export type HomeGroupRow = typeof homeGroups.$inferSelect;
