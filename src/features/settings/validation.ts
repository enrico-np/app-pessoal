import { z } from "zod";

export const THEMES = ["light", "dark", "system"] as const;
export const TEXT_SIZES = ["sm", "md", "lg"] as const;
export const PIN_ORDERS = ["manual", "usage"] as const;
export const HISTORY_COUNT_MIN = 1;
export const HISTORY_COUNT_MAX = 5;

export type Theme = (typeof THEMES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];
export type PinOrder = (typeof PIN_ORDERS)[number];

// One schema per stored key. Keys are the app_settings.key values (spec 002).
export const settingSchemas = {
  theme: z.enum(THEMES, { error: "Tema inválido." }),
  text_size: z.enum(TEXT_SIZES, { error: "Tamanho de texto inválido." }),
  pins_order: z.enum(PIN_ORDERS, { error: "Ordem inválida." }),
  history_count: z
    .int({ error: "Informe um número inteiro." })
    .min(HISTORY_COUNT_MIN, { error: `Mostre pelo menos ${HISTORY_COUNT_MIN} item.` })
    .max(HISTORY_COUNT_MAX, { error: `Mostre no máximo ${HISTORY_COUNT_MAX} itens.` }),
  // Unix time in milliseconds of the last backup download, or null if there was none.
  last_backup_at: z.int().nonnegative().nullable(),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

export type Settings = { [K in SettingKey]: z.infer<(typeof settingSchemas)[K]> };

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  text_size: "md",
  pins_order: "manual",
  history_count: 3,
  last_backup_at: null,
};

export function isSettingKey(key: unknown): key is SettingKey {
  return typeof key === "string" && (SETTING_KEYS as string[]).includes(key);
}

// Cookies that mirror theme and text size so the inline script in layout.tsx can apply them before first paint.
export const THEME_COOKIE = "ap_theme";
export const TEXT_SIZE_COOKIE = "ap_text";
