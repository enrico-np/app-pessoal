import "server-only";
import { connection } from "next/server";
import { db } from "@/db/client";
import { activityFeatureKeys, listActivity, type ActivityFilter } from "./queries";

// Reads for rendering. connection() keeps them out of build-time prerendering (see CLAUDE.md).
export async function readActivity(filter: ActivityFilter) {
  await connection();
  return listActivity(db, filter);
}

export async function readActivityFeatureKeys() {
  await connection();
  return activityFeatureKeys(db);
}
