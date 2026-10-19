import { beforeEach, expect, test } from "vitest";
import type { Db } from "@/db/types";
import { logActivity } from "@/features/activity/log";
import { parsePeriod } from "@/features/activity/period";
import { activityFeatureKeys, listActivity, pinOpenCountsSince } from "@/features/activity/queries";
import { completeTaskMutation } from "@/features/tasks/mutations";
import { countOpenTasks, listOldestOpenTasks } from "@/features/tasks/queries";
import { tasks } from "@/features/tasks/schema";
import { createTestDb } from "./helpers/db";

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

const at = (day: number, hour = 12) => new Date(2026, 9, day, hour, 0);

function seed() {
  logActivity(db, { featureKey: "tasks", action: "a", summary: "t11", at: at(11, 23) });
  logActivity(db, { featureKey: "tasks", action: "a", summary: "t12", at: at(12, 0) });
  logActivity(db, { featureKey: "general", action: "a", summary: "g15", at: at(15) });
  logActivity(db, { featureKey: "tasks", action: "a", summary: "t18", at: at(18, 23) });
  logActivity(db, { kind: "open", featureKey: "visit", action: "page.open", summary: "/", targetHref: "/", at: at(18) });
}

test("listActivity returns change entries newest first, without open entries", () => {
  seed();
  expect(listActivity(db).map((e) => e.summary)).toEqual(["t18", "g15", "t12", "t11"]);
  expect(listActivity(db, { limit: 2 }).map((e) => e.summary)).toEqual(["t18", "g15"]);
});

test("filters by feature and by an inclusive day range", () => {
  seed();
  const p = parsePeriod({ de: "2026-10-12", ate: "2026-10-18" }, at(18, 15));
  expect(listActivity(db, { from: p.from, to: p.to }).map((e) => e.summary)).toEqual(["t18", "g15", "t12"]);
  expect(listActivity(db, { featureKey: "tasks", from: p.from, to: p.to }).map((e) => e.summary)).toEqual([
    "t18",
    "t12",
  ]);
  expect(activityFeatureKeys(db)).toEqual(["general", "tasks"]);
});

test("Início entries are not offered as a feature chip", () => {
  seed();
  logActivity(db, { featureKey: "home", action: "home.edited", summary: "Início editado · 1 mudança", details: ["x"] });
  expect(activityFeatureKeys(db)).toEqual(["general", "tasks"]);
  expect(listActivity(db)[0].details).toEqual(["x"]);
});

test("pinOpenCountsSince counts only pin taps per target, since the given date", () => {
  seed(); // includes a page.open row for "/", which must not count
  const tap = (href: string, day: number) =>
    logActivity(db, { kind: "open", featureKey: "home", action: "pin.open", summary: href, targetHref: href, at: at(day) });
  tap("https://www.youtube.com/", 17);
  tap("https://www.youtube.com/", 18);
  tap("/historico", 16);
  tap("/historico", 1);
  expect(pinOpenCountsSince(db, at(10))).toEqual(
    new Map([
      ["https://www.youtube.com/", 2],
      ["/historico", 1],
    ]),
  );
});

test("completing a task marks it done and logs it", () => {
  db.insert(tasks).values([{ title: "Pagar luz" }, { title: "Dentista" }]).run();
  const [first] = listOldestOpenTasks(db, 3);
  expect(completeTaskMutation(db, first.id)).toEqual({ ok: true });
  expect(countOpenTasks(db)).toBe(1);
  expect(listActivity(db)[0].summary).toBe("Tarefa “Pagar luz” concluída");
  expect(completeTaskMutation(db, 999)).toEqual({ ok: false, error: "Tarefa não encontrada." });
});
