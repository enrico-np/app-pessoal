import { formatInteger } from "@/lib/format";
import { getOpenTaskCount } from "../data";

// Menu summary card (registered in src/features/menu/cards.ts).
export async function OpenTasksCard() {
  const n = await getOpenTaskCount();
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-3xl font-semibold tabular-nums">{formatInteger(n)}</span>
      <span className="text-sm text-muted">{n === 1 ? "tarefa aberta" : "tarefas abertas"}</span>
    </p>
  );
}
