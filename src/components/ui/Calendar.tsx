"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { monthGrid, toIsoDay, WEEKDAY_INITIALS, type IsoDay } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatLongDate, formatMonthYear } from "@/lib/format";

export type DayRange = { from?: IsoDay; to?: IsoDay };

// Month grid for picking a range of days. First tap sets the start, second tap the end (swapped if earlier).
// Days after `today` are disabled. ISO day strings compare correctly as text.
export function Calendar({ value, onChange, today }: { value: DayRange; onChange: (r: DayRange) => void; today: IsoDay }) {
  const [year, month] = (value.to ?? value.from ?? today).split("-").map(Number);
  const [view, setView] = useState({ year, month: month - 1 });
  const cells = monthGrid(view.year, view.month);
  const todayDate = today.slice(0, 7);
  const viewKey = `${view.year}-${String(view.month + 1).padStart(2, "0")}`;

  function shift(delta: number) {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  }

  function pick(day: IsoDay) {
    if (!value.from || value.to) return onChange({ from: day });
    return onChange(day < value.from ? { from: day, to: value.from } : { from: value.from, to: day });
  }

  const end = value.to ?? value.from;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => shift(-1)}
          className="flex size-tap items-center justify-center rounded-control border-2 border-border bg-surface [&_svg]:size-4"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <span className="font-bold" aria-live="polite">
          {formatMonthYear(new Date(view.year, view.month, 1))}
        </span>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => shift(1)}
          disabled={viewKey >= todayDate}
          className="flex size-tap items-center justify-center rounded-control border-2 border-border bg-surface disabled:opacity-40 [&_svg]:size-4"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
      <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs font-bold text-muted">
        {WEEKDAY_INITIALS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div role="group" aria-label={formatMonthYear(new Date(view.year, view.month, 1))} className="grid grid-cols-7 gap-y-1">
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const iso = toIsoDay(date);
          const isStart = iso === value.from;
          const isEnd = iso === end;
          const inside = value.from !== undefined && end !== undefined && iso > value.from && iso < end;
          return (
            <button
              key={iso}
              type="button"
              disabled={iso > today}
              aria-pressed={isStart || isEnd || inside}
              aria-label={formatLongDate(date)}
              onClick={() => pick(iso)}
              className={cn(
                "h-11 font-mono text-sm font-bold disabled:font-medium disabled:text-muted disabled:opacity-60",
                (isStart || isEnd) && "border-2 border-border bg-accent text-accent-foreground",
                isStart && "rounded-l-control",
                isEnd && "rounded-r-control",
                inside && "border-y-2 border-border bg-accent/25",
                iso === today && !isStart && !isEnd && "underline underline-offset-4",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
