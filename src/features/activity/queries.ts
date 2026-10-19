import { and, count, desc, eq, gte, isNotNull, lt, ne, type SQL } from "drizzle-orm";
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

// Feature keys that have at least one "change" entry, for the filter chips. Início ("home") is not a
// feature (spec 003): its entries are listed only under "Tudo".
export function activityFeatureKeys(db: Db): string[] {
  return db
    .selectDistinct({ key: activityLog.featureKey })
    .from(activityLog)
    .where(and(eq(activityLog.kind, "change"), ne(activityLog.featureKey, "home")))
    .all()
    .map((r) => r.key)
    .sort();
}

// Number of pin taps per target since a date, for "Ordenar pelos mais usados" (spec 003). Older "open"
// rows from page visits have other actions and are not counted.
export function pinOpenCountsSince(db: Db, since: Date): Map<string, number> {
  const rows = db
    .select({ href: activityLog.targetHref, n: count() })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.kind, "open"),
        eq(activityLog.action, "pin.open"),
        gte(activityLog.createdAt, since),
        isNotNull(activityLog.targetHref),
      ),
    )
    .groupBy(activityLog.targetHref)
    .all();
  return new Map(rows.map((r) => [r.href as string, r.n]));
}
