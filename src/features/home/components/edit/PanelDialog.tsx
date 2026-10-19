"use client";

import { useState } from "react";
import { Button, Dialog, SegmentedControl } from "@/components/ui";
import type { DraftPanel } from "../../draft";
import { panelType, SIZE_LABELS } from "../../panel-types";
import type { PanelSize } from "../../schema";
import { ConfigFields, draftFrom, toConfig } from "./ConfigFields";

// Edit one panel: its config fields and size. Its place is changed by dragging (spec 003).
export function PanelDialog({
  panel,
  error,
  onClose,
  onSave,
}: {
  panel: DraftPanel;
  error: string | null;
  onClose: () => void;
  onSave: (update: { size: PanelSize; config?: Record<string, unknown> }) => void;
}) {
  const type = panelType(panel.typeKey);
  const [size, setSize] = useState<PanelSize>(panel.size);
  const [draft, setDraft] = useState(draftFrom(panel.config));
  const hasConfig = panel.typeKey === "general.counter" || panel.typeKey === "general.note";
  return (
    <Dialog open onClose={onClose} title={`Editar “${type?.nameOf(panel.config) ?? panel.typeKey}”`}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ size, config: hasConfig ? toConfig(panel.typeKey, draft) : undefined });
        }}
      >
        <ConfigFields typeKey={panel.typeKey} draft={draft} onChange={setDraft} />
        {type && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-[0.06em] text-muted uppercase">Tamanho</span>
            <SegmentedControl
              label="Tamanho"
              options={type.sizes.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
              value={size}
              onChange={setSize}
            />
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="min-h-12 text-base font-bold">
          Salvar
        </Button>
      </form>
    </Dialog>
  );
}
