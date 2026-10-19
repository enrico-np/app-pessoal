import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PanelSize } from "../schema";

// Card around every panel. sm panels take one of two columns; md and lg take the full row.
export function PanelFrame({
  size,
  title,
  aside,
  children,
}: {
  size: PanelSize;
  title: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article
      data-panel-title={title}
      data-panel-size={size}
      className={cn(
        "flex min-w-0 flex-col gap-2.5 rounded-card border-2 border-border bg-surface shadow-hard",
        size === "sm" ? "col-span-1 p-3" : "col-span-2 p-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className={cn("min-w-0 truncate font-bold", size === "sm" ? "text-[0.8125rem]" : "text-sm")}>{title}</h4>
        {aside}
      </div>
      {children}
    </article>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border-2 border-border bg-accent px-2.5 font-mono text-sm font-bold text-accent-foreground tabular-nums">
      {children}
    </span>
  );
}
