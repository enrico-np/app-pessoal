import { ChevronDown, ChevronRight, Hash, House, ListChecks, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { pressRow } from "@/components/ui/pressable";
import { featureLabel } from "@/features/catalog";
import { cn } from "@/lib/cn";
import { formatTime, formatWhen } from "@/lib/format";
import type { ActivityRow } from "../schema";

const FEATURE_ICONS: Record<string, LucideIcon> = { home: House, tasks: ListChecks, general: Hash };

const row = "flex min-h-15 items-center gap-3 py-2 pr-3 pl-4";

// Rows of activity entries. On Início the meta line is "hoje, 14:32"; in Histórico entries are already
// grouped by day, so the meta line is "Tarefas · 14:32". An entry with details (an edit session, spec 003)
// expands in place to list them; <details> gives the open/closed state and keyboard support without JS.
export function ActivityList({ entries, now, showFeature }: { entries: ActivityRow[]; now: Date; showFeature: boolean }) {
  return (
    <ul className="overflow-hidden rounded-card border-2 border-border bg-surface shadow-hard">
      {entries.map((e, i) => {
        const IconComponent = FEATURE_ICONS[e.featureKey] ?? Hash;
        const meta = showFeature ? `${featureLabel(e.featureKey)} · ${formatTime(e.createdAt)}` : formatWhen(e.createdAt, now);
        const text = (
          <>
            <IconComponent aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{e.summary}</span>
              <span className="text-xs text-muted">{meta}</span>
            </span>
          </>
        );
        let content;
        if (e.details && e.details.length > 0) {
          content = (
            <details className="group">
              <summary className={cn(row, pressRow, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>
                {text}
                <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted group-open:rotate-180" />
              </summary>
              <ol className="flex list-decimal flex-col gap-1 border-t-2 border-dashed border-border py-2 pr-3 pl-12 text-sm">
                {e.details.map((d, j) => (
                  <li key={j}>{d}</li>
                ))}
              </ol>
            </details>
          );
        } else if (e.targetHref) {
          content = (
            <Link href={e.targetHref} className={cn(row, pressRow)}>
              {text}
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </Link>
          );
        } else {
          content = <div className={row}>{text}</div>;
        }
        return (
          <li key={e.id} className={i > 0 ? "border-t-2 border-border" : undefined}>
            {content}
          </li>
        );
      })}
    </ul>
  );
}
