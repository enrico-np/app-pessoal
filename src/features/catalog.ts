import type { IconName } from "@/components/ui/icon-names";

// pt-BR names of the feature keys used in home_panels.group_key and activity_log.feature_key.
// A key missing here is shown as the raw key.
export const FEATURE_LABELS: Record<string, string> = {
  home: "Início",
  tasks: "Tarefas",
  general: "Geral",
};

export function featureLabel(key: string): string {
  return FEATURE_LABELS[key] ?? key;
}

// Pages a pin can open (the "Destino" select, spec 003). A feature with a page adds it here.
export type AppPage = { href: string; label: string; icon: IconName };

export const APP_PAGES: readonly AppPage[] = [
  { href: "/", label: "Início", icon: "house" },
  { href: "/historico", label: "Histórico", icon: "clock" },
];

export function appPage(href: string): AppPage | undefined {
  return APP_PAGES.find((p) => p.href === href);
}
