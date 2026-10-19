"use server";

import { refresh } from "next/cache";
import { db } from "@/db/client";
import type { ActionResult } from "@/lib/result";
import { completeTaskMutation } from "./mutations";

export async function completeTaskAction(taskId: unknown): Promise<ActionResult> {
  const result = completeTaskMutation(db, taskId);
  if (result.ok) refresh();
  return result;
}
