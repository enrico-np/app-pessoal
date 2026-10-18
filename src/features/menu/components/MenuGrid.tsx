"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { BlockSize, MenuBlockRow } from "../schema";
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
};

export function MenuGrid({ blocks, cardNodes }: Props) {
  const [editing, setEditing] = useState(false);

  const toggle = (
    <Button variant={editing ? "primary" : "secondary"} onClick={() => setEditing(!editing)}>
      {editing ? "Concluir" : "Editar"}
    </Button>
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
      <div className="flex justify-end">{toggle}</div>
      <ul className="grid auto-rows-[7.5rem] grid-cols-2 gap-3 md:grid-cols-4">
        {blocks.map((block) => (
          <li key={block.id} className={cn(sizeClasses[block.size])}>
            {renderBlock(block, cardNodes[block.id])}
          </li>
        ))}
      </ul>
    </div>
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
