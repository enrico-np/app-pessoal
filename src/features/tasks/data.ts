import "server-only";
import { connection } from "next/server";
import { db } from "@/db/client";
import { countOpenTasks } from "./queries";

// Reads for rendering. connection() keeps them out of build-time prerendering (see CLAUDE.md).
export async function getOpenTaskCount() {
  await connection();
  return countOpenTasks(db);
}
