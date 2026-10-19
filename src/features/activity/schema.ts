import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ACTIVITY_KINDS = ["change", "open"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

// "change" rows are listed in Histórico. "open" rows (page visits, external pin taps) only feed the
// "Ordenar pelos mais usados" ordering of Fixados and are never shown.
export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ACTIVITY_KINDS }).notNull(),
    featureKey: text("feature_key").notNull(),
    action: text("action").notNull(),
    summary: text("summary").notNull(),
    targetHref: text("target_href"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("activity_log_created_at_idx").on(t.createdAt), index("activity_log_kind_idx").on(t.kind)],
);

export type ActivityRow = typeof activityLog.$inferSelect;
