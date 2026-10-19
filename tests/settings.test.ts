import { beforeEach, expect, test } from "vitest";
import type { Db } from "@/db/types";
import { updateSettingMutation } from "@/features/settings/mutations";
import { getSettings } from "@/features/settings/queries";
import { appSettings } from "@/features/settings/schema";
import { DEFAULT_SETTINGS } from "@/features/settings/validation";
import { createTestDb } from "./helpers/db";

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

test("an empty table gives the defaults", () => {
  expect(getSettings(db)).toEqual(DEFAULT_SETTINGS);
});

test("valid values are stored and read back", () => {
  expect(updateSettingMutation(db, "theme", "dark").ok).toBe(true);
  expect(updateSettingMutation(db, "history_count", 5).ok).toBe(true);
  expect(updateSettingMutation(db, "pins_order", "usage").ok).toBe(true);
  expect(getSettings(db)).toMatchObject({ theme: "dark", history_count: 5, pins_order: "usage" });
});

test("invalid values are rejected with a pt-BR message", () => {
  expect(updateSettingMutation(db, "history_count", 0)).toEqual({ ok: false, error: "Mostre pelo menos 1 item." });
  expect(updateSettingMutation(db, "history_count", 6)).toEqual({ ok: false, error: "Mostre no máximo 5 itens." });
  expect(updateSettingMutation(db, "theme", "blue")).toEqual({ ok: false, error: "Tema inválido." });
  expect(updateSettingMutation(db, "colors", "x")).toEqual({ ok: false, error: "Ajuste desconhecido." });
  expect(getSettings(db)).toEqual(DEFAULT_SETTINGS);
});

test("a corrupt stored value falls back to the default for that key only", () => {
  db.insert(appSettings).values([{ key: "theme", value: "neon" }, { key: "text_size", value: "lg" }]).run();
  expect(getSettings(db)).toMatchObject({ theme: "system", text_size: "lg" });
});
