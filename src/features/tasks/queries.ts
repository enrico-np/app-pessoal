import { asc, count, eq } from "drizzle-orm";
import type { Db, DbOrTx } from "@/db/types";
import { tasks } from "./schema";

export function countOpenTasks(db: Db): number {
  return db.select({ n: count() }).from(tasks).where(eq(tasks.done, false)).get()?.n ?? 0;
}

// Oldest first: tasks waiting longest are shown on the large "Tarefas abertas" panel.
export function listOldestOpenTasks(db: Db, limit: number) {
  return db.select().from(tasks).where(eq(tasks.done, false)).orderBy(asc(tasks.createdAt), asc(tasks.id)).limit(limit).all();
}

export function completeTask(db: DbOrTx, id: number) {
  return db.update(tasks).set({ done: true }).where(eq(tasks.id, id)).returning().get();
}
