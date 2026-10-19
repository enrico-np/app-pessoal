import { z } from "zod";
import { ICON_NAMES } from "@/components/ui/icon-names";
import { isValidHref } from "@/lib/href";
import { PANEL_SIZES } from "./schema";

export const PIN_MAX = 6;
export const PIN_LABEL_MAX = 20;

export const pinSchema = z.object({
  label: z
    .string({ error: "Informe um nome." })
    .trim()
    .min(1, { error: "Informe um nome." })
    .max(PIN_LABEL_MAX, { error: `O nome pode ter no máximo ${PIN_LABEL_MAX} caracteres.` }),
  icon: z.enum(ICON_NAMES, { error: "Escolha um ícone da lista." }),
  href: z
    .string({ error: "Informe um endereço." })
    .trim()
    .refine(isValidHref, { error: "Use um caminho que comece com / ou um endereço http:// ou https://." }),
});

export type PinInput = z.infer<typeof pinSchema>;

export const newPanelSchema = z.object({
  typeKey: z.string(),
  size: z.enum(PANEL_SIZES, { error: "Tamanho inválido." }),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const panelUpdateSchema = z.object({
  size: z.enum(PANEL_SIZES, { error: "Tamanho inválido." }).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const directionSchema = z.enum(["earlier", "later"]);
export type Direction = z.infer<typeof directionSchema>;

export const idSchema = z.int().positive();

// Shape of a layout snapshot sent back by the client for undo/redo. Dates arrive as Date (RSC) or ISO strings.
export const layoutSchema = z.object({
  pins: z.array(
    z.object({
      id: idSchema,
      label: z.string(),
      icon: z.string(),
      href: z.string(),
      position: z.int(),
      createdAt: z.coerce.date(),
    }),
  ),
  panels: z.array(
    z.object({
      id: idSchema,
      typeKey: z.string(),
      groupKey: z.string(),
      size: z.enum(PANEL_SIZES),
      position: z.int(),
      config: z.record(z.string(), z.unknown()),
      createdAt: z.coerce.date(),
    }),
  ),
  groups: z.array(z.object({ groupKey: z.string(), position: z.int() })),
});
