import { ChevronRight, Hash, House, ListChecks, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { featureLabel } from "@/features/catalog";
import { formatTime, formatWhen } from "@/lib/format";
import type { ActivityRow } from "../schema";

const FEATURE_ICONS: Record<string, LucideIcon> = { home: House, tasks: ListChecks, general: Hash };

// Rows of activity entries. On Início the meta line is "hoje, 14:32"; in Histórico entries are already
// grouped by day, so the meta line is "Tarefas · 14:32".
export function ActivityList({ entries, now, showFeature }: { entries: ActivityRow[]; now: Date; showFeature: boolean }) {
  return (
    <ul className="overflow-hidden rounded-card border-2 border-border bg-surface shadow-hard">
      {entries.map((e, i) => {
        const IconComponent = FEATURE_ICONS[e.featureKey] ?? Hash;
        const meta = showFeature ? `${featureLabel(e.featureKey)} · ${formatTime(e.createdAt)}` : formatWhen(e.createdAt, now);
        const content = (
          <>
            <IconComponent aria-hidden="true" className="size-5 shrink-0 text-muted" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm">{e.summary}</span>
              <span className="text-xs text-muted">{meta}</span>
            </span>
            {e.targetHref && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />}
          </>
        );
        const row = "flex min-h-15 items-center gap-3 py-2 pr-3 pl-4";
        return (
          <li key={e.id} className={i > 0 ? "border-t-2 border-border" : undefined}>
            {e.targetHref ? (
              <Link href={e.targetHref} className={row}>
                {content}
              </Link>
            ) : (
              <div className={row}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
