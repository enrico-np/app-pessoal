"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Calendar, ChipButton, Dialog, IconButton, type DayRange } from "@/components/ui";
import { parseIsoDay, type IsoDay } from "@/lib/calendar";
import { formatShortDate } from "@/lib/format";
import { PERIOD_PRESETS, type PeriodKey } from "../period";

// Period picker for Histórico (design board E5b). Builds the URL query; the page does the filtering.
export function PeriodSheet({
  feature,
  current,
  range,
  today,
}: {
  feature?: string;
  current: PeriodKey;
  range: DayRange;
  today: IsoDay;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<PeriodKey>(current);
  const [days, setDays] = useState<DayRange>(range);

  function go(params: Record<string, string>) {
    const q = new URLSearchParams(params);
    if (feature) q.set("feature", feature);
    setOpen(false);
    router.push(`/historico${q.size ? `?${q}` : ""}`);
  }

  const first = parseIsoDay(days.from);
  const last = parseIsoDay(days.to ?? days.from);
  const applyLabel =
    preset === "custom" && first && last
      ? `Mostrar ${first.getTime() === last.getTime() ? formatShortDate(first) : `${formatShortDate(first)} a ${formatShortDate(last)}`}`
      : "Mostrar";

  return (
    <>
      <IconButton label="Filtrar por período" onClick={() => setOpen(true)}>
        <CalendarDays aria-hidden="true" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} title="Período">
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="Atalhos de período" className="flex flex-wrap gap-2">
            {PERIOD_PRESETS.map((p) => (
              <ChipButton key={p.key} selected={preset === p.key} onClick={() => setPreset(p.key)}>
                {p.label}
              </ChipButton>
            ))}
          </div>
          <Calendar
            value={days}
            today={today}
            onChange={(r) => {
              setDays(r);
              setPreset("custom");
            }}
          />
          <p className="text-[0.8125rem] text-muted">Toque no primeiro e no último dia. Dias futuros ficam desativados.</p>
          <Button
            className="min-h-12 text-base font-bold"
            disabled={preset === "custom" && !days.from}
            onClick={() =>
              preset === "custom"
                ? go({ de: days.from!, ate: days.to ?? days.from! })
                : preset === "all"
                  ? go({})
                  : go({ periodo: preset })
            }
          >
            {applyLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
