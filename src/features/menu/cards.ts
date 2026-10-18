import type { ComponentType } from "react";

// Summary cards that features register for the menu. The key is stored in menu_blocks.config.cardKey.
export type MenuCard = {
  label: string; // pt-BR, shown in the block picker
  Component: ComponentType;
};

export const cards: Record<string, MenuCard> = {};

export const cardKeys: readonly string[] = Object.keys(cards);
