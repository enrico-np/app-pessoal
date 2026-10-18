"use client";

import { useState, type ReactNode } from "react";
import { Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BlockSize, MenuBlockRow } from "../schema";
import { BlockEditor, TYPE_LABELS, type CardOption } from "./BlockEditor";
import { CardBlock, CounterBlock, NoteBlock, ShortcutBlock } from "./blocks";

// 2 columns on phones, 4 from 768 px. sm = 1x1, md = 2x1, lg = 2x2 (spec 001).
const sizeClasses: Record<BlockSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-2 row-span-1",
  lg: "col-span-2 row-span-2",
};

type Props = {
  blocks: MenuBlockRow[];
  // Card blocks render server components; the server passes them in already rendered, keyed by block id.
  cardNodes: Record<number, ReactNode>;
  cardOptions: CardOption[];
};

// "new" opens the editor to create a block; a number opens it for that block id.
type EditorTarget = "new" | number | null;

export function MenuGrid({ blocks, cardNodes, cardOptions }: Props) {
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState<EditorTarget>(null);

  const index = typeof target === "number" ? blocks.findIndex((b) => b.id === target) : -1;
  const editedBlock = index >= 0 ? blocks[index] : undefined;
  const close = () => setTarget(null);

  const toggle = (
    <Button variant={editing ? "primary" : "secondary"} onClick={() => setEditing(!editing)}>
      {editing ? "Concluir" : "Editar"}
    </Button>
  );

  const editor = (
    <Dialog
      open={target !== null}
      onClose={close}
      title={editedBlock ? `Editar “${editedBlock.label}”` : "Adicionar bloco"}
    >
      <BlockEditor
        key={editedBlock?.id ?? "new"}
        block={editedBlock}
        isFirst={index === 0}
        isLast={index === blocks.length - 1}
        cardOptions={cardOptions}
        onClose={close}
      />
    </Dialog>
  );

  if (blocks.length === 0 && !editing) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-border p-8 text-center">
        <p className="text-muted">Seu menu está vazio. Adicione atalhos, notas, contadores e resumos.</p>
        {toggle}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {editing ? <p className="text-sm text-muted">Toque em um bloco para editar.</p> : <span />}
        {toggle}
      </div>
      <ul className="grid auto-rows-[7.5rem] grid-cols-2 gap-3 md:grid-cols-4">
        {blocks.map((block) => (
          <li key={block.id} className={sizeClasses[block.size]} data-block-label={block.label}>
            {editing ? (
              <EditableBlock block={block} onEdit={() => setTarget(block.id)} />
            ) : (
              renderBlock(block, cardNodes[block.id])
            )}
          </li>
        ))}
        {editing && (
          <li className="col-span-1 row-span-1">
            <button
              type="button"
              onClick={() => setTarget("new")}
              className={cn(
                "flex size-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-border text-muted",
                "hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              )}
            >
              <span className="text-2xl" aria-hidden="true">
                +
              </span>
              <span className="text-sm font-medium">Adicionar bloco</span>
            </button>
          </li>
        )}
      </ul>
      {editor}
    </div>
  );
}

// In edit mode the whole block is one button that opens the editor; its normal controls are not active.
function EditableBlock({ block, onEdit }: { block: MenuBlockRow; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={`Editar ${block.label}`}
      className={cn(
        "flex size-full flex-col justify-between rounded-card border-2 border-dashed border-accent bg-surface p-4 text-left",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
        {block.icon && <span aria-hidden="true">{block.icon}</span>}
        <span className="truncate">{block.label}</span>
      </span>
      <span className="flex items-center justify-between text-xs text-muted">
        <span>{TYPE_LABELS[block.type]}</span>
        <span aria-hidden="true">✏️</span>
      </span>
    </button>
  );
}

function renderBlock(block: MenuBlockRow, card: ReactNode) {
  switch (block.type) {
    case "shortcut":
      return <ShortcutBlock block={block} />;
    case "note":
      return <NoteBlock block={block} />;
    case "counter":
      return <CounterBlock block={block} />;
    case "card":
      return <CardBlock block={block} card={card} />;
  }
}
