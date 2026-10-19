import { z } from "zod";
import type { Db } from "@/db/types";
import { logActivity } from "@/features/activity/log";
import { fail, type ActionResult } from "@/lib/result";
import { completeTask } from "./queries";

export function completeTaskMutation(db: Db, taskId: unknown): ActionResult {
  const id = z.int().positive().safeParse(taskId);
  if (!id.success) return fail("Tarefa não encontrada.");
  return db.transaction((tx) => {
    const task = completeTask(tx, id.data);
    if (!task) return fail("Tarefa não encontrada.");
    logActivity(tx, { featureKey: "tasks", action: "task.done", summary: `Tarefa “${task.title}” concluída`, targetHref: "/" });
    return { ok: true } as const;
  });
}
