import { count, eq } from "drizzle-orm";
import type { Db } from "@/db/types";
import { tasks } from "./schema";

export function countOpenTasks(db: Db): number {
  return db.select({ n: count() }).from(tasks).where(eq(tasks.done, false)).get()?.n ?? 0;
}
