"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { isFutureMonth, monthGrid, toIsoDay, WEEKDAY_INITIALS, yearPage, YEARS_PER_PAGE, type IsoDay } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatLongDate, formatMonthLong, formatMonthShort, formatMonthYear } from "@/lib/format";
import { pressFlat, pressRow } from "./pressable";

export type DayRange = { from?: IsoDay; to?: IsoDay };

type View = "days" | "months" | "years";

const arrow = cn(
  "flex size-tap items-center justify-center rounded-control border-2 border-border bg-surface disabled:opacity-40 [&_svg]:size-4",
  pressFlat,
);
const cell = cn(
  "h-11 rounded-control font-bold disabled:font-medium disabled:text-muted disabled:opacity-60",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground",
);

// Month grid for picking a range of days. First tap sets the start, second tap the end (swapped if earlier).
// The title switches to a month view, and from there to a year view (spec 003). Dates after `today` are
// disabled in every view. ISO day strings compare correctly as text.
export function Calendar({ value, onChange, today }: { value: DayRange; onChange: (r: DayRange) => void; today: IsoDay }) {
  const [year, month] = (value.to ?? value.from ?? today).split("-").map(Number);
  const [view, setView] = useState({ year, month: month - 1, mode: "days" as View });
  const todayYear = Number(today.slice(0, 4));

  function shift(delta: number) {
    if (view.mode === "years") return setView({ ...view, year: view.year + delta * YEARS_PER_PAGE });
    if (view.mode === "months") return setView({ ...view, year: view.year + delta });
    const d = new Date(view.year, view.month + delta, 1);
    setView({ ...view, year: d.getFullYear(), month: d.getMonth() });
  }

  function pick(day: IsoDay) {
    if (!value.from || value.to) return onChange({ from: day });
    return onChange(day < value.from ? { from: day, to: value.from } : { from: value.from, to: day });
  }

  const years = yearPage(view.year);
  const nextDisabled =
    view.mode === "days"
      ? isFutureMonth(view.year, view.month + 1, today)
      : view.mode === "months"
        ? view.year >= todayYear
        : years.at(-1)! >= todayYear;
  const labels = {
    days: ["Mês anterior", "Próximo mês"],
    months: ["Ano anterior", "Próximo ano"],
    years: ["Anos anteriores", "Próximos anos"],
  }[view.mode];

  let title;
  if (view.mode === "days") {
    title = (
      <button
        type="button"
        aria-label={`${formatMonthYear(new Date(view.year, view.month, 1))}. Escolher mês`}
        onClick={() => setView({ ...view, mode: "months" })}
        className={cn("min-h-tap rounded-control px-3 font-bold hover:bg-foreground/10", pressFlat)}
      >
        {formatMonthYear(new Date(view.year, view.month, 1))}
      </button>
    );
  } else if (view.mode === "months") {
    title = (
      <button
        type="button"
        aria-label={`${view.year}. Escolher ano`}
        onClick={() => setView({ ...view, mode: "years" })}
        className={cn("min-h-tap rounded-control px-3 font-bold hover:bg-foreground/10", pressFlat)}
      >
        {view.year}
      </button>
    );
  } else {
    title = (
      <span className="font-bold">
        {years[0]} – {years.at(-1)}
      </span>
    );
  }

  const end = value.to ?? value.from;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button type="button" aria-label={labels[0]} onClick={() => shift(-1)} className={arrow}>
          <ChevronLeft aria-hidden="true" />
        </button>
        <span aria-live="polite">{title}</span>
        <button type="button" aria-label={labels[1]} onClick={() => shift(1)} disabled={nextDisabled} className={arrow}>
          <ChevronRight aria-hidden="true" />
        </button>
      </div>

      {view.mode === "years" && (
        <div role="group" aria-label="Anos" className="grid grid-cols-3 gap-2">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              disabled={y > todayYear}
              aria-pressed={y === view.year}
              onClick={() => setView({ ...view, year: y, mode: "months" })}
              className={cn(cell, "font-mono", pressRow, y === view.year && "border-2 border-border bg-accent text-accent-foreground")}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      {view.mode === "months" && (
        <div role="group" aria-label={`Meses de ${view.year}`} className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, m) => {
            const date = new Date(view.year, m, 1);
            const current = m === view.month;
            return (
              <button
                key={m}
                type="button"
                disabled={isFutureMonth(view.year, m, today)}
                aria-pressed={current}
                aria-label={formatMonthLong(date)}
                onClick={() => setView({ year: view.year, month: m, mode: "days" })}
                className={cn(cell, "text-sm", pressRow, current && "border-2 border-border bg-accent text-accent-foreground")}
              >
                {formatMonthShort(date)}
              </button>
            );
          })}
        </div>
      )}

      {view.mode === "days" && (
        <>
          <div aria-hidden="true" className="grid grid-cols-7 text-center text-xs font-bold text-muted">
            {WEEKDAY_INITIALS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div role="group" aria-label={formatMonthYear(new Date(view.year, view.month, 1))} className="grid grid-cols-7 gap-y-1">
            {monthGrid(view.year, view.month).map((date, i) => {
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
                    pressRow,
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
        </>
      )}
    </div>
  );
}
