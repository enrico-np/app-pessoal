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
