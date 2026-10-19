import type { DbOrTx } from "@/db/types";
import { activityLog, type ActivityKind, type ActivityRow } from "./schema";

export type ActivityEntry = {
  kind?: ActivityKind;
  featureKey: string;
  action: string;
  summary: string;
  targetHref?: string | null;
  details?: string[] | null;
  at?: Date;
};

// Called from other features' mutations after a successful write. Takes the db (or a transaction) as a parameter.
export function logActivity(db: DbOrTx, entry: ActivityEntry): ActivityRow {
  return db
    .insert(activityLog)
    .values({
      kind: entry.kind ?? "change",
      featureKey: entry.featureKey,
      action: entry.action,
      summary: entry.summary,
      targetHref: entry.targetHref ?? null,
      details: entry.details ?? null,
      ...(entry.at ? { createdAt: entry.at } : {}),
    })
    .returning()
    .get();
}
