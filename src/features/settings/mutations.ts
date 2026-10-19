import type { Db } from "@/db/types";
import { fail, firstMessage, type DataResult } from "@/lib/result";
import { setSetting } from "./queries";
import { isSettingKey, settingSchemas, type SettingKey, type Settings } from "./validation";

// Validation + write, without Next.js APIs, so tests can call it. actions.ts wraps it.
export function updateSettingMutation(
  db: Db,
  key: unknown,
  value: unknown,
): DataResult<{ key: SettingKey; value: Settings[SettingKey] }> {
  if (!isSettingKey(key)) return fail("Ajuste desconhecido.");
  const parsed = settingSchemas[key].safeParse(value);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  setSetting(db, key, parsed.data as Settings[typeof key]);
  return { ok: true, data: { key, value: parsed.data } };
}
