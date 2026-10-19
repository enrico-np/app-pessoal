"use client";

import { useState } from "react";
import { Button, ChipButton, Dialog, SegmentedControl } from "@/components/ui";
import { featureLabel } from "@/features/catalog";
import { cn } from "@/lib/cn";
import { PANEL_TYPES, SIZE_LABELS } from "../../panel-types";
import type { PanelSize } from "../../schema";
import { ConfigFields, toConfig, type ConfigDraft } from "./ConfigFields";

const FEATURES = [...new Set(PANEL_TYPES.map((t) => t.feature))];

// Add sheet (spec 002, design board E2): feature, then panel type, then size.
export function AddPanelDialog({
  open,
  initialFeature,
  usedTypeKeys,
  pending,
  error,
  onClose,
  onAdd,
}: {
  open: boolean;
  initialFeature?: string;
  usedTypeKeys: string[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onAdd: (input: { typeKey: string; size: PanelSize; config: Record<string, unknown> }) => void;
}) {
  const available = (key: string) => !(PANEL_TYPES.find((t) => t.key === key)?.single && usedTypeKeys.includes(key));
  // Without a requested feature, open on the first one that still has a panel to add.
  const [feature, setFeature] = useState(
    initialFeature ?? FEATURES.find((f) => PANEL_TYPES.some((t) => t.feature === f && available(t.key))) ?? FEATURES[0],
  );
  const types = PANEL_TYPES.filter((t) => t.feature === feature);
  const [typeKey, setTypeKey] = useState(types.find((t) => available(t.key))?.key ?? "");
  const type = PANEL_TYPES.find((t) => t.key === typeKey);
  const [size, setSize] = useState<PanelSize>("md");
  const [draft, setDraft] = useState<ConfigDraft>({});

  function chooseFeature(f: string) {
    setFeature(f);
    const first = PANEL_TYPES.find((t) => t.feature === f && available(t.key));
    chooseType(first?.key ?? "");
  }

  function chooseType(key: string) {
    setTypeKey(key);
    const t = PANEL_TYPES.find((x) => x.key === key);
    if (t && !t.sizes.includes(size)) setSize(t.sizes.includes("md") ? "md" : t.sizes[0]);
    setDraft({});
  }

  return (
    <Dialog open={open} onClose={onClose} title="Adicionar painel">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (type) onAdd({ typeKey: type.key, size, config: toConfig(type.key, draft) });
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-bold tracking-[0.06em] text-muted uppercase">Funcionalidade</legend>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((f) => (
              <ChipButton key={f} selected={f === feature} onClick={() => chooseFeature(f)}>
                {featureLabel(f)}
              </ChipButton>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs font-bold tracking-[0.06em] text-muted uppercase">Painel</legend>
          {types.map((t) => {
            const ok = available(t.key);
            return (
              <label
                key={t.key}
                className={cn(
                  "flex items-center gap-3 rounded-card border-2 p-3",
                  !ok && "border-dashed border-muted text-muted",
                  ok && t.key === typeKey && "border-border bg-accent/25 shadow-hard",
                  ok && t.key !== typeKey && "border-border bg-surface",
                )}
              >
                <input
                  type="radio"
                  name="panel-type"
                  value={t.key}
                  checked={t.key === typeKey}
                  disabled={!ok}
                  onChange={() => chooseType(t.key)}
                  className="size-5 shrink-0 accent-[var(--foreground)]"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-bold">{t.label}</span>
                  <span className="text-xs text-muted">{ok ? t.description : "Já está no início"}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {type && (
          <>
            <ConfigFields typeKey={type.key} draft={draft} onChange={setDraft} />
            <div className="flex flex-col gap-2">
              <span id="add-size" className="text-xs font-bold tracking-[0.06em] text-muted uppercase">
                Tamanho
              </span>
              <SegmentedControl
                label="Tamanho"
                options={type.sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
                value={size}
                onChange={setSize}
              />
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={!type || pending} className="min-h-12 text-base font-bold">
          Adicionar ao início
        </Button>
      </form>
    </Dialog>
  );
}
