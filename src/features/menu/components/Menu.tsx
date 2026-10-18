import type { ReactNode } from "react";
import { cards } from "../cards";
import { getMenuBlocks } from "../data";
import { MenuGrid } from "./MenuGrid";

// Server side of the menu: reads blocks at request time and renders card components.
export async function Menu() {
  const blocks = await getMenuBlocks();
  const cardNodes: Record<number, ReactNode> = {};
  for (const block of blocks) {
    if (block.type !== "card") continue;
    const card = typeof block.config.cardKey === "string" ? cards[block.config.cardKey] : undefined;
    if (card) cardNodes[block.id] = <card.Component />;
  }
  return <MenuGrid blocks={blocks} cardNodes={cardNodes} />;
}

export function MenuSkeleton() {
  return (
    <div className="grid auto-rows-[7.5rem] grid-cols-2 gap-3 md:grid-cols-4" aria-busy="true" aria-label="Carregando menu">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="animate-pulse rounded-card bg-border/50" />
      ))}
    </div>
  );
}
