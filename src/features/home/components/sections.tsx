import { Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import { pressFlat, pressHard } from "@/components/ui/pressable";
import { ActivityList } from "@/features/activity/components/ActivityList";
import { readActivity } from "@/features/activity/data";
import { featureLabel } from "@/features/catalog";
import { readSettings } from "@/features/settings/data";
import { cn } from "@/lib/cn";
import { readLayout, readPins } from "../data";
import { PIN_MAX } from "../validation";
import { Panel } from "./panels";
import { PinLink } from "./PinLink";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xs leading-4 font-bold tracking-[0.06em] text-muted uppercase">{children}</h2>;
}

export const tile = "flex size-15 items-center justify-center rounded-card border-2 border-border shadow-hard-sm [&_svg]:size-6";

export async function PinsSection() {
  const pins = await readPins();
  return (
    <section aria-labelledby="fixados" className="flex flex-col gap-3">
      <SectionTitle>
        <span id="fixados">Fixados</span>
      </SectionTitle>
      {pins.length === 0 ? (
        <Link href="/editar" className={cn("flex items-center gap-3 rounded-card text-sm", pressFlat)}>
          <span className="flex size-15 shrink-0 items-center justify-center rounded-card border-2 border-dashed border-muted [&_svg]:size-6">
            <Plus aria-hidden="true" />
          </span>
          <span className="flex flex-col">
            <span className="font-bold">Fixe até {PIN_MAX} atalhos</span>
            <span className="text-[0.8125rem] text-muted">Para abrir o que você mais usa com um toque.</span>
          </span>
        </Link>
      ) : (
        <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {pins.map((pin, i) => (
            <li key={pin.id} className="w-16 shrink-0 snap-start">
              <PinLink href={pin.href} className={cn("flex flex-col items-center gap-2 text-center text-xs", pressFlat)}>
                <span className={cn(tile, i === 0 ? "bg-accent text-accent-foreground" : "bg-surface")}>
                  <Icon name={pin.icon} />
                </span>
                <span className="w-full truncate">{pin.label}</span>
              </PinLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export async function PanelsSection() {
  const { panels, groups } = await readLayout();
  const byGroup = groups
    .map((g) => ({ key: g.groupKey, panels: panels.filter((p) => p.groupKey === g.groupKey) }))
    .filter((g) => g.panels.length > 0);
  return (
    <section aria-labelledby="paineis" className="flex flex-col gap-4">
      <SectionTitle>
        <span id="paineis">Painéis</span>
      </SectionTitle>
      {byGroup.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border-2 border-border bg-surface px-5 py-6 text-center shadow-hard">
          <h3 className="text-xl font-bold">Seu início está vazio</h3>
          <p className="text-sm text-muted">Adicione painéis para ver suas tarefas, contadores e notas assim que abrir o app.</p>
          <Link
            href="/editar?adicionar=1"
            className={cn(
              "mt-1 inline-flex min-h-12 items-center gap-2 rounded-control border-2 border-border bg-accent px-5 font-bold text-accent-foreground [&_svg]:size-4",
              pressHard,
            )}
          >
            <Plus aria-hidden="true" />
            Adicionar primeiro painel
          </Link>
        </div>
      ) : (
        byGroup.map((g) => (
          <div key={g.key} className="flex flex-col gap-2" data-group={g.key}>
            <h3 className="text-[1.0625rem] leading-6 font-bold">{featureLabel(g.key)}</h3>
            <div className="grid grid-cols-2 gap-3">
              {g.panels.map((p) => (
                <Panel key={p.id} panel={p} />
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export async function HistorySection() {
  const settings = await readSettings();
  const entries = await readActivity({ limit: settings.history_count });
  return (
    <section aria-labelledby="historico" className="flex flex-col gap-3">
      <SectionTitle>
        <span id="historico">Histórico</span>
      </SectionTitle>
      {entries.length === 0 ? (
        <p className="text-sm text-muted">Nada por aqui ainda. O que você fizer no app aparece aqui.</p>
      ) : (
        <>
          <ActivityList entries={entries} now={new Date()} showFeature={false} />
          <Link
            href="/historico"
            className={cn("flex min-h-tap items-center justify-center rounded-control border-2 border-border bg-surface text-sm", pressHard)}
          >
            Ver histórico completo
          </Link>
        </>
      )}
    </section>
  );
}
