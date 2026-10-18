import { z } from "zod";
import { BLOCK_SIZES, type BlockType } from "./schema";

export const ICONS = [
  "⭐", "📌", "✅", "📝", "📅", "⏰", "💰", "💳",
  "🛒", "🍽️", "💪", "🏃", "😴", "💊", "📚", "🎯",
  "💼", "🏠", "🚗", "✈️", "🎵", "🎮", "💡", "🔗",
] as const;

export const LABEL_MAX = 40;
export const NOTE_MAX = 2000;

// Internal path ("/x", but not protocol-relative "//x") or an absolute http(s) URL.
export function isValidHref(href: string): boolean {
  if (href.startsWith("/")) return !href.startsWith("//") && !/\s/.test(href);
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    const url = new URL(href);
    return url.hostname.length > 0;
  } catch {
    return false;
  }
}

const label = z
  .string()
  .trim()
  .min(1, { error: "Informe um nome." })
  .max(LABEL_MAX, { error: `O nome pode ter no máximo ${LABEL_MAX} caracteres.` });

const icon = z.enum(ICONS, { error: "Escolha um ícone da lista." }).nullable();
const size = z.enum(BLOCK_SIZES, { error: "Tamanho inválido." });

const shortcutConfig = z.object({
  href: z
    .string()
    .trim()
    .refine(isValidHref, { error: "Use um caminho que comece com / ou um endereço http:// ou https://." }),
});

const noteConfig = z.object({
  text: z.string().max(NOTE_MAX, { error: `A nota pode ter no máximo ${NOTE_MAX} caracteres.` }),
});

const counterConfig = z.object({
  value: z.int({ error: "O contador precisa ser um número inteiro." }),
});

function cardConfig(cardKeys: readonly string[]) {
  return z.object({
    cardKey: z.string().refine((k) => cardKeys.includes(k), { error: "Resumo desconhecido." }),
  });
}

// cardKeys comes from the card registry; passed in so this module has no React imports and stays unit-testable.
export function configSchema(type: BlockType, cardKeys: readonly string[]) {
  switch (type) {
    case "shortcut":
      return shortcutConfig;
    case "note":
      return noteConfig;
    case "counter":
      return counterConfig;
    case "card":
      return cardConfig(cardKeys);
  }
}

export function newBlockSchema(cardKeys: readonly string[]) {
  const base = { label, icon: icon.default(null), size: size.default("sm") };
  return z.discriminatedUnion("type", [
    z.object({ type: z.literal("shortcut"), ...base, config: shortcutConfig }),
    z.object({ type: z.literal("note"), ...base, config: noteConfig }),
    z.object({ type: z.literal("counter"), ...base, config: counterConfig.default({ value: 0 }) }),
    z.object({ type: z.literal("card"), ...base, config: cardConfig(cardKeys) }),
  ]);
}

export type NewBlock = z.infer<ReturnType<typeof newBlockSchema>>;

// Fields that can change after creation. The type never changes; config is checked against the stored type.
export const blockUpdateSchema = z.object({
  label: label.optional(),
  icon: icon.optional(),
  size: size.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export type BlockUpdate = z.infer<typeof blockUpdateSchema>;
