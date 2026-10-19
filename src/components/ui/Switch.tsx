"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// A whole-row toggle: the row is the button, so the tap target is the full width.
export function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left text-sm",
        "focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-foreground disabled:opacity-50",
      )}
    >
      {icon && <span className="shrink-0 [&_svg]:size-5">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-border p-0.5 transition-colors",
          checked ? "justify-end bg-accent" : "justify-start bg-background",
        )}
      >
        <span className="size-5 rounded-full border-2 border-border bg-surface" />
      </span>
    </button>
  );
}
