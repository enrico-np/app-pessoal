import { expect, test } from "vitest";
import { countOpenTasks } from "@/features/tasks/queries";
import { tasks } from "@/features/tasks/schema";
import { createTestDb } from "./helpers/db";

test("countOpenTasks counts only tasks with done = false", () => {
  const db = createTestDb();
  expect(countOpenTasks(db)).toBe(0);
  db.insert(tasks).values([{ title: "a" }, { title: "b" }, { title: "c", done: true }]).run();
  expect(countOpenTasks(db)).toBe(2);
});
