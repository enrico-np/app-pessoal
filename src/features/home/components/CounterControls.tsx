"use client";

import { Minus, Plus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { formatInteger } from "@/lib/format";
import { changeCounterAction } from "../actions";
import type { PanelSize } from "../schema";

const stepButton = cn(
  "inline-flex size-tap shrink-0 items-center justify-center rounded-control border-2 border-border shadow-hard-sm [&_svg]:size-5",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
);

// Interactive part of the counter panel; works outside edit mode. Shows the value optimistically.
export function CounterControls({
  id,
  label,
  value: stored,
  goal,
  size,
}: {
  id: number;
  label: string;
  value: number;
  goal: number | null;
  size: PanelSize;
}) {
  const [value, addDelta] = useOptimistic(stored, (current: number, delta: number) => current + delta);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(delta: 1 | -1) {
    setError(null);
    startTransition(async () => {
      addDelta(delta);
      const result = await changeCounterAction(id, delta);
      if (!result.ok) setError(result.error);
    });
  }

  const minus = (
    <button type="button" aria-label={`Diminuir ${label}`} onClick={() => change(-1)} className={cn(stepButton, "bg-surface")}>
      <Minus aria-hidden="true" />
    </button>
  );
  const plus = (
    <button type="button" aria-label={`Aumentar ${label}`} onClick={() => change(1)} className={cn(stepButton, "bg-accent text-accent-foreground")}>
      <Plus aria-hidden="true" />
    </button>
  );
  const number = (
    <output aria-live="polite" className="font-mono text-2xl font-bold tabular-nums">
      {formatInteger(value)}
      {goal !== null && size === "sm" && <span className="text-sm text-muted">/{formatInteger(goal)}</span>}
    </output>
  );

  return (
    <>
      {size === "sm" && (
        <div className="flex items-center justify-between gap-2">
          {number}
          {plus}
        </div>
      )}
      {size === "md" && (
        <div className="flex items-center justify-between gap-3">
          {minus}
          {number}
          {plus}
        </div>
      )}
      {size === "lg" && (
        <>
          {goal !== null && (
            <div
              role="img"
              aria-label={`${formatInteger(value)} de ${formatInteger(goal)}`}
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${Math.min(goal, 10)}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: goal }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-9 rounded-control border-2",
                    i < value ? "border-border bg-accent" : "border-dashed border-muted",
                  )}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {goal === null
                ? `Valor: ${formatInteger(value)}`
                : value >= goal
                  ? "Meta do dia alcançada"
                  : `Faltam ${formatInteger(goal - value)}`}
            </span>
            <span className="flex gap-3">
              {minus}
              {plus}
            </span>
          </div>
        </>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </>
  );
}
