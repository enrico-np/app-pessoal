"use client";

import { cn } from "@/lib/cn";
import { pressRow } from "./pressable";

export type Segment<T extends string> = { value: T; label: string; ariaLabel?: string; className?: string };

// Radio group drawn as joined buttons (Tamanho do texto, panel sizes).
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-control border-2 border-border">
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.ariaLabel}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-tap min-w-tap flex-1 px-3 text-sm",
              i > 0 && "border-l-2 border-border",
              // Joined segments share borders, so they only tint; scaling would open gaps between them.
              selected ? "bg-accent font-bold text-accent-foreground" : cn("bg-surface text-foreground", pressRow),
              "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-foreground disabled:opacity-50",
              o.className,
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
