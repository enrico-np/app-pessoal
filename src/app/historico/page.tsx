import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChipLink, IconButton, PageHeader } from "@/components/ui";
import { ActivityList } from "@/features/activity/components/ActivityList";
import { PeriodSheet } from "@/features/activity/components/PeriodSheet";
import { readActivity, readActivityFeatureKeys } from "@/features/activity/data";
import { parsePeriod } from "@/features/activity/period";
import type { ActivityRow } from "@/features/activity/schema";
import { featureLabel } from "@/features/catalog";
import { toIsoDay } from "@/lib/calendar";
import { formatDayLabel, startOfDay } from "@/lib/format";

export const metadata: Metadata = { title: "Histórico · App Pessoal" };

type Params = { feature?: string; periodo?: string; de?: string; ate?: string };

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function href(params: Params): string {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])));
  return `/historico${q.size ? `?${q}` : ""}`;
}

function groupByDay(entries: ActivityRow[]) {
  const groups: { day: Date; entries: ActivityRow[] }[] = [];
  for (const e of entries) {
    const day = startOfDay(e.createdAt);
    const last = groups.at(-1);
    if (last && last.day.getTime() === day.getTime()) last.entries.push(e);
    else groups.push({ day, entries: [e] });
  }
  return groups;
}

async function History({ searchParams }: { searchParams: PageProps<"/historico">["searchParams"] }) {
  const raw = await searchParams;
  const params: Params = {
    feature: one(raw.feature),
    periodo: one(raw.periodo),
    de: one(raw.de),
    ate: one(raw.ate),
  };
  // new Date() needs a request first under cacheComponents ("unstable value while prerendering").
  await connection();
  const now = new Date();
  const period = parsePeriod(params, now);
  const [features, entries] = await Promise.all([
    readActivityFeatureKeys(),
    readActivity({ featureKey: params.feature, from: period.from, to: period.to }),
  ]);
  const periodParams = { periodo: params.periodo, de: params.de, ate: params.ate };
  const lastDay = period.to ? new Date(period.to.getTime() - 1) : undefined;

  return (
    <>
      <PageHeader
        title="Histórico"
        actions={
          <PeriodSheet
            feature={params.feature}
            current={period.key}
            range={period.key === "custom" && period.from && lastDay ? { from: toIsoDay(period.from), to: toIsoDay(lastDay) } : {}}
            today={toIsoDay(now)}
          />
        }
      />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-6 pb-32">
        <nav aria-label="Filtrar por feature" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1.5 [scrollbar-width:none]">
          <ChipLink href={href(periodParams)} selected={!params.feature}>
            Tudo
          </ChipLink>
          {features.map((f) => (
            <ChipLink key={f} href={href({ ...periodParams, feature: f })} selected={params.feature === f}>
              {featureLabel(f)}
            </ChipLink>
          ))}
        </nav>

        <div className="-mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex min-h-10 items-center gap-2 rounded-control border-2 border-border bg-accent/25 px-3 text-sm [&_svg]:size-4">
            <CalendarDays aria-hidden="true" />
            {period.label}
          </span>
          {period.key !== "all" && (
            <Link
              href={href({ feature: params.feature })}
              className="inline-flex min-h-tap items-center px-2 text-sm text-link underline"
            >
              Limpar período
            </Link>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-muted">Nada registrado neste período.</p>
        ) : (
          groupByDay(entries).map((g) => (
            <section key={g.day.getTime()} className="flex flex-col gap-2">
              <h2 className="text-xs font-bold tracking-[0.06em] text-muted uppercase">{formatDayLabel(g.day, now)}</h2>
              <ActivityList entries={g.entries} now={now} showFeature />
            </section>
          ))
        )}
      </main>
    </>
  );
}

export default function HistoryPage({ searchParams }: PageProps<"/historico">) {
  return (
    <Suspense
      fallback={
        <PageHeader
          title="Histórico"
          actions={
            <IconButton label="Filtrar por período" disabled>
              <CalendarDays aria-hidden="true" />
            </IconButton>
          }
        />
      }
    >
      <History searchParams={searchParams} />
    </Suspense>
  );
}
