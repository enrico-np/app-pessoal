"use client";

import { cn } from "@/lib/cn";
import { ICONS } from "../validation";

type Props = {
  value: string | null;
  onChange: (icon: string | null) => void;
};

// Radio group of the fixed icon list plus "no icon".
export function IconPicker({ value, onChange }: Props) {
  const options: (string | null)[] = [null, ...ICONS];
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">Ícone</legend>
      <div role="radiogroup" className="grid grid-cols-6 gap-1 sm:grid-cols-9">
        {options.map((icon) => {
          const selected = icon === value;
          return (
            <button
              key={icon ?? "none"}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={icon ?? "Sem ícone"}
              onClick={() => onChange(icon)}
              className={cn(
                "flex size-tap items-center justify-center rounded-control border text-xl",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                selected ? "border-accent bg-accent/10" : "border-transparent hover:bg-border/50",
              )}
            >
              {icon ?? <span className="text-sm text-muted">—</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
