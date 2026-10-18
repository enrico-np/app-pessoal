"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { changeCounterAction } from "../actions";
import type { MenuBlockRow } from "../schema";

// Renderers for each block type in normal mode. Config fields are read defensively:
// rows are validated on write, but the column is untyped JSON.

function BlockTitle({ block }: { block: MenuBlockRow }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
      {block.icon && <span aria-hidden="true">{block.icon}</span>}
      <span className="truncate">{block.label}</span>
    </span>
  );
}

export function ShortcutBlock({ block }: { block: MenuBlockRow }) {
  const href = typeof block.config.href === "string" ? block.config.href : "/";
  const className = cn(
    "flex h-full flex-col justify-between rounded-card border border-border bg-surface p-4 transition",
    "hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  );
  const content = (
    <>
      <BlockTitle block={block} />
      <span className="self-end text-muted" aria-hidden="true">
        →
      </span>
    </>
  );
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}

function Frame({ block, children }: { block: MenuBlockRow; children: ReactNode }) {
  return (
    <section className="flex h-full flex-col gap-2 overflow-hidden rounded-card border border-border bg-surface p-4">
      <BlockTitle block={block} />
      {children}
    </section>
  );
}

export function NoteBlock({ block }: { block: MenuBlockRow }) {
  const text = typeof block.config.text === "string" ? block.config.text : "";
  return (
    <Frame block={block}>
      <p className="min-h-0 flex-1 overflow-y-auto text-sm whitespace-pre-wrap text-muted">{text}</p>
    </Frame>
  );
}

export function CounterBlock({ block }: { block: MenuBlockRow }) {
  const stored = typeof block.config.value === "number" ? block.config.value : 0;
  const [value, addDelta] = useOptimistic(stored, (current: number, delta: number) => current + delta);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(delta: 1 | -1) {
    setError(null);
    startTransition(async () => {
      addDelta(delta);
      const result = await changeCounterAction(block.id, delta);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <Frame block={block}>
      <div className="flex flex-1 items-center justify-between gap-2">
        <Button variant="secondary" size="icon" onClick={() => change(-1)} aria-label={`Diminuir ${block.label}`}>
          −
        </Button>
        <output className="text-2xl font-semibold tabular-nums" aria-live="polite">
          {formatInteger(value)}
        </output>
        <Button variant="secondary" size="icon" onClick={() => change(1)} aria-label={`Aumentar ${block.label}`}>
          +
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Frame>
  );
}

export function CardBlock({ block, card }: { block: MenuBlockRow; card: ReactNode }) {
  return (
    <Frame block={block}>
      <div className="min-h-0 flex-1">
        {card ?? <p className="text-sm text-muted">Resumo indisponível.</p>}
      </div>
    </Frame>
  );
}
