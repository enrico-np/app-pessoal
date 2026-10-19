import { appSettings } from "./schema";
import { DEFAULT_SETTINGS, isSettingKey, settingSchemas, type SettingKey, type Settings } from "./validation";
import type { Db } from "@/db/types";

// Plain query functions. Pages read through data.ts (see CLAUDE.md).

// Missing or invalid stored values fall back to the default for that key.
export function getSettings(db: Db): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS };
  for (const row of db.select().from(appSettings).all()) {
    if (!isSettingKey(row.key)) continue;
    const parsed = settingSchemas[row.key].safeParse(row.value);
    if (parsed.success) (settings as Record<SettingKey, unknown>)[row.key] = parsed.data;
  }
  return settings;
}

// Value must already be parsed with settingSchemas[key].
export function setSetting<K extends SettingKey>(db: Db, key: K, value: Settings[K]): void {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}
