"use client";

import { Input, Textarea } from "@/components/ui";

export type ConfigDraft = { label?: string; goal?: string; title?: string; text?: string };

// Form fields for each panel type's config. Values are kept as strings and converted in toConfig().
export function ConfigFields({
  typeKey,
  draft,
  onChange,
}: {
  typeKey: string;
  draft: ConfigDraft;
  onChange: (d: ConfigDraft) => void;
}) {
  if (typeKey === "general.counter") {
    return (
      <>
        <Input label="Nome" value={draft.label ?? ""} maxLength={40} onChange={(e) => onChange({ ...draft, label: e.target.value })} />
        <Input
          label="Meta do dia (opcional)"
          inputMode="numeric"
          value={draft.goal ?? ""}
          onChange={(e) => onChange({ ...draft, goal: e.target.value.replace(/\D/g, "") })}
        />
      </>
    );
  }
  if (typeKey === "general.note") {
    return (
      <>
        <Input label="Título" value={draft.title ?? ""} maxLength={40} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
        <Textarea label="Texto" value={draft.text ?? ""} maxLength={2000} onChange={(e) => onChange({ ...draft, text: e.target.value })} />
      </>
    );
  }
  return null;
}

export function draftFrom(config: Record<string, unknown>): ConfigDraft {
  return {
    label: typeof config.label === "string" ? config.label : undefined,
    goal: typeof config.goal === "number" ? String(config.goal) : "",
    title: typeof config.title === "string" ? config.title : undefined,
    text: typeof config.text === "string" ? config.text : undefined,
  };
}

// Only the fields of the given type; the server validates and fills defaults.
export function toConfig(typeKey: string, d: ConfigDraft): Record<string, unknown> {
  if (typeKey === "general.counter") return { label: d.label ?? "", goal: d.goal ? Number(d.goal) : null };
  if (typeKey === "general.note") return { title: d.title ?? "", text: d.text ?? "" };
  return {};
}
