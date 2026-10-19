import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ACTIVITY_KINDS = ["change", "open"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

// "change" rows are listed in Histórico. "open" rows are never shown; those with action "pin.open" feed the
// "Ordenar pelos mais usados" ordering of Fixados. Rows with action "page.open" (page visits, written
// before spec 003) are no longer written or counted.
export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ACTIVITY_KINDS }).notNull(),
    featureKey: text("feature_key").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    targetHref: text("target_href"),
    // Edit sessions (spec 003): the pt-BR summary of each change, in order. Null for other entries.
    details: text("details", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("activity_log_created_at_idx").on(t.createdAt), index("activity_log_kind_idx").on(t.kind)],
);

export type ActivityRow = typeof activityLog.$inferSelect;
