"use client";

import { useState } from "react";
import { Button, Dialog, SegmentedControl } from "@/components/ui";
import { panelType, SIZE_LABELS } from "../../panel-types";
import type { HomePanelRow, PanelSize } from "../../schema";
import type { Direction } from "../../validation";
import { ConfigFields, draftFrom, toConfig } from "./ConfigFields";

// Edit one panel: its config fields, size, and place inside its group.
export function PanelDialog({
  panel,
  isFirst,
  isLast,
  pending,
  error,
  onClose,
  onSave,
  onMove,
}: {
  panel: HomePanelRow;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (update: { size: PanelSize; config?: Record<string, unknown> }) => void;
  onMove: (direction: Direction) => void;
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
        <Button type="submit" disabled={pending} className="min-h-12 text-base font-bold">
          Salvar
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={pending || isFirst} onClick={() => onMove("earlier")}>
            ↑ Mover para cima
          </Button>
          <Button variant="secondary" disabled={pending || isLast} onClick={() => onMove("later")}>
            ↓ Mover para baixo
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
