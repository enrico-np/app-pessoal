import { and, count, desc, eq, gte, isNotNull, lt, type SQL } from "drizzle-orm";
import type { Db } from "@/db/types";
import { activityLog, type ActivityRow } from "./schema";

// Plain query functions. Pages read through data.ts (see CLAUDE.md).

export type ActivityFilter = {
  featureKey?: string;
  from?: Date; // inclusive
  to?: Date; // exclusive
  limit?: number;
};

// "change" entries, newest first.
export function listActivity(db: Db, filter: ActivityFilter = {}): ActivityRow[] {
  const conditions: SQL[] = [eq(activityLog.kind, "change")];
  if (filter.featureKey) conditions.push(eq(activityLog.featureKey, filter.featureKey));
  if (filter.from) conditions.push(gte(activityLog.createdAt, filter.from));
  if (filter.to) conditions.push(lt(activityLog.createdAt, filter.to));
  const query = db
    .select()
    .from(activityLog)
    .where(and(...conditions))
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id));
  return filter.limit ? query.limit(filter.limit).all() : query.all();
}

// Feature keys that have at least one "change" entry, for the filter chips.
export function activityFeatureKeys(db: Db): string[] {
  return db
    .selectDistinct({ key: activityLog.featureKey })
    .from(activityLog)
    .where(eq(activityLog.kind, "change"))
    .all()
    .map((r) => r.key)
    .sort();
}

// Number of "open" entries per target since a date, for "Ordenar pelos mais usados".
export function openCountsSince(db: Db, since: Date): Map<string, number> {
  const rows = db
    .select({ href: activityLog.targetHref, n: count() })
    .from(activityLog)
    .where(and(eq(activityLog.kind, "open"), gte(activityLog.createdAt, since), isNotNull(activityLog.targetHref)))
    .groupBy(activityLog.targetHref)
    .all();
  return new Map(rows.map((r) => [r.href as string, r.n]));
}
