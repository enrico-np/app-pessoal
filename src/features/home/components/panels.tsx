import { getOldestOpenTasks, getOpenTaskCount } from "@/features/tasks/data";
import { TaskCheckbox } from "@/features/tasks/components/TaskCheckbox";
import { formatInteger } from "@/lib/format";
import { panelType, type CounterConfig, type NoteConfig } from "../panel-types";
import type { HomePanelRow } from "../schema";
import { CounterControls } from "./CounterControls";
import { Badge, PanelFrame } from "./PanelFrame";

// Components for each panel type and size (spec 002, design board E7). Types are declared in panel-types.ts.

async function OpenTasksPanel({ panel }: { panel: HomePanelRow }) {
  const n = await getOpenTaskCount();
  const word = n === 1 ? "tarefa aberta" : "tarefas abertas";
  if (panel.size === "sm") {
    return (
      <PanelFrame size="sm" title="Tarefas abertas">
        <span className="font-mono text-3xl leading-9 font-bold tabular-nums">{formatInteger(n)}</span>
      </PanelFrame>
    );
  }
  const oldest = panel.size === "lg" ? await getOldestOpenTasks(3) : [];
  return (
    <PanelFrame size={panel.size} title="Tarefas abertas" aside={<Badge>{formatInteger(n)}</Badge>}>
      <p className="text-sm text-muted">{n === 0 ? "Nenhuma tarefa aberta." : `${formatInteger(n)} ${word}`}</p>
      {oldest.length > 0 && (
        <ul className="flex flex-col" aria-label="Tarefas mais antigas">
          {oldest.map((t) => (
            <TaskCheckbox key={t.id} id={t.id} title={t.title} />
          ))}
        </ul>
      )}
    </PanelFrame>
  );
}

function CounterPanel({ panel }: { panel: HomePanelRow }) {
  const c = panel.config as Partial<CounterConfig>;
  const label = c.label ?? "Contador";
  const goal = typeof c.goal === "number" ? c.goal : null;
  return (
    <PanelFrame
      size={panel.size}
      title={label}
      aside={panel.size === "lg" && goal !== null ? <span className="text-sm text-muted">Meta: {formatInteger(goal)}</span> : undefined}
    >
      <CounterControls id={panel.id} label={label} value={typeof c.value === "number" ? c.value : 0} goal={goal} size={panel.size} />
    </PanelFrame>
  );
}

function NotePanel({ panel }: { panel: HomePanelRow }) {
  const c = panel.config as Partial<NoteConfig>;
  return (
    <PanelFrame size={panel.size} title={c.title ?? "Nota"}>
      <p
        className={
          panel.size === "lg"
            ? "text-sm whitespace-pre-wrap text-muted [overflow-wrap:anywhere]"
            : "line-clamp-4 text-sm whitespace-pre-wrap text-muted [overflow-wrap:anywhere]"
        }
      >
        {c.text || "Nota vazia."}
      </p>
    </PanelFrame>
  );
}

export function Panel({ panel }: { panel: HomePanelRow }) {
  switch (panel.typeKey) {
    case "tasks.open-count":
      return <OpenTasksPanel panel={panel} />;
    case "general.counter":
      return <CounterPanel panel={panel} />;
    case "general.note":
      return <NotePanel panel={panel} />;
    default:
      // A type removed from panel-types.ts: the row stays, the page does not break.
      return (
        <PanelFrame size={panel.size === "sm" ? "sm" : "md"} title={panelType(panel.typeKey)?.label ?? "Painel indisponível"}>
          <p className="text-sm text-muted">Este painel não está mais disponível.</p>
        </PanelFrame>
      );
  }
}
