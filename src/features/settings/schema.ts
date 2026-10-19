import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Key-value settings. Each key's value is validated with its own Zod schema in validation.ts.
export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>().notNull(),
});

export type AppSettingRow = typeof appSettings.$inferSelect;
