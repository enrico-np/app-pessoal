import type { ReactNode } from "react";

// Teal band at the top of every main tab (spec 002). Text on --accent is --accent-foreground (6.2:1).
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="border-b-2 border-border bg-accent text-accent-foreground">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-8 pb-6">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="text-3xl leading-9 font-bold">{title}</h1>
          {subtitle && <p className="text-sm">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
