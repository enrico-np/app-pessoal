import { z } from "zod";
import { ICON_NAMES } from "@/components/ui/icon-names";
import { settingSchemas } from "@/features/settings/validation";
import { isValidHref } from "@/lib/href";
import { PANEL_SIZES } from "./schema";

export const PIN_MAX = 8;
export const PIN_LABEL_MAX = 20;
export const PIN_CAP_MESSAGE = `Você já fixou ${PIN_MAX} atalhos. Remova um para fixar outro.`;

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

export const idSchema = z.int().positive();

export const CHANGE_MAX = 500;

// What the edit screen sends on Concluir (spec 003). Ids of rows added in the session are 0 or negative.
// Panel configs and the panel type rules are checked again in saveEditSessionMutation.
export const editSessionSchema = z.object({
  pins: z.array(pinSchema.extend({ id: z.int() })),
  groups: z.array(
    z.object({
      key: z.string().min(1),
      panels: z.array(
        z.object({
          id: z.int(),
          typeKey: z.string(),
          size: z.enum(PANEL_SIZES, { error: "Tamanho inválido." }),
          config: z.record(z.string(), z.unknown()),
        }),
      ),
    }),
  ),
  settings: z.object({ pins_order: settingSchemas.pins_order, history_count: settingSchemas.history_count }),
  changes: z.array(z.string().min(1).max(300)).min(1).max(CHANGE_MAX),
});

export type EditSessionInput = z.infer<typeof editSessionSchema>;
