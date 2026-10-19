import { z } from "zod";
import type { PanelSize } from "./schema";

// Panel types that features offer for Início (spec 002). No React here so validation and tests can import it;
// the components for each type and size are mapped in components/panels.tsx.
// Adding a feature's panel: add its type here, its components in panels.tsx, and its label in features/catalog.ts.

export const LABEL_MAX = 40;
export const NOTE_MAX = 2000;
export const GOAL_MAX = 99;

const name = z
  .string({ error: "Informe um nome." })
  .trim()
  .min(1, { error: "Informe um nome." })
  .max(LABEL_MAX, { error: `O nome pode ter no máximo ${LABEL_MAX} caracteres.` });

const counterConfig = z.object({
  label: name,
  value: z.int({ error: "O contador precisa ser um número inteiro." }).default(0),
  goal: z
    .int({ error: "A meta precisa ser um número inteiro." })
    .min(1, { error: "A meta precisa ser pelo menos 1." })
    .max(GOAL_MAX, { error: `A meta pode ser no máximo ${GOAL_MAX}.` })
    .nullable()
    .default(null),
});

const noteConfig = z.object({
  title: name,
  text: z.string().max(NOTE_MAX, { error: `A nota pode ter no máximo ${NOTE_MAX} caracteres.` }).default(""),
});

export type PanelType = {
  key: string;
  feature: string;
  label: string;
  description: string;
  sizes: readonly PanelSize[];
  // true: at most one panel of this type on Início.
  single: boolean;
  config: z.ZodType<Record<string, unknown>>;
  // Name used in history entries and edit rows.
  nameOf: (config: Record<string, unknown>) => string;
};

export const PANEL_TYPES: readonly PanelType[] = [
  {
    key: "tasks.open-count",
    feature: "tasks",
    label: "Tarefas abertas",
    description: "Quantas tarefas estão abertas; no grande, marque as mais antigas como feitas.",
    sizes: ["sm", "md", "lg"],
    single: true,
    config: z.object({}),
    nameOf: () => "Tarefas abertas",
  },
  {
    key: "general.counter",
    feature: "general",
    label: "Contador",
    description: "Um número com + e −. No grande, mostra a meta do dia.",
    sizes: ["sm", "md", "lg"],
    single: false,
    config: counterConfig,
    nameOf: (c) => (typeof c.label === "string" ? c.label : "Contador"),
  },
  {
    key: "general.note",
    feature: "general",
    label: "Nota",
    description: "Texto livre.",
    sizes: ["md", "lg"],
    single: false,
    config: noteConfig,
    nameOf: (c) => (typeof c.title === "string" ? c.title : "Nota"),
  },
];

export const SIZE_LABELS: Record<PanelSize, string> = { sm: "Pequeno", md: "Médio", lg: "Grande" };

export function panelType(key: string): PanelType | undefined {
  return PANEL_TYPES.find((t) => t.key === key);
}

export type CounterConfig = z.infer<typeof counterConfig>;
export type NoteConfig = z.infer<typeof noteConfig>;
