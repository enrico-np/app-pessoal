import type { ComponentType } from "react";
import { OpenTasksCard } from "@/features/tasks/components/OpenTasksCard";

// Summary cards that features register for the menu. The key is stored in menu_blocks.config.cardKey;
// changing a key orphans existing blocks (they show "Resumo indisponível.").
export type MenuCard = {
  label: string; // pt-BR, shown in the block picker
  Component: ComponentType;
};

export const cards: Record<string, MenuCard> = {
  "open-tasks": { label: "Tarefas abertas", Component: OpenTasksCard },
};

export const cardKeys: readonly string[] = Object.keys(cards);
