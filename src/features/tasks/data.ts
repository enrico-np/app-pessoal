import "server-only";
import { connection } from "next/server";
import { db } from "@/db/client";
import { countOpenTasks, listOldestOpenTasks } from "./queries";

// Reads for rendering. connection() keeps them out of build-time prerendering (see CLAUDE.md).
export async function getOpenTaskCount() {
  await connection();
  return countOpenTasks(db);
}

export async function getOldestOpenTasks(limit: number) {
  await connection();
  return listOldestOpenTasks(db, limit);
}
