import { beforeEach, expect, test } from "vitest";
import type { Db } from "@/db/types";
import { listActivity } from "@/features/activity/queries";
import { addPinMutation, movePinMutation, removePinMutation } from "@/features/home/mutations";
import { listPins, sortPinsByUsage } from "@/features/home/queries";
import { createTestDb } from "./helpers/db";

let db: Db;
beforeEach(() => {
  db = createTestDb();
});

function pin(label: string, href = "/") {
  return addPinMutation(db, { label, icon: "star", href });
}

test("up to 6 pins; the 7th is rejected with a pt-BR message", () => {
  for (let i = 1; i <= 6; i++) expect(pin(`P${i}`).ok).toBe(true);
  expect(pin("P7")).toEqual({ ok: false, error: "Você já fixou 6 atalhos. Remova um para fixar outro." });
  expect(listPins(db)).toHaveLength(6);
});

test("href, label and icon are validated", () => {
  expect(addPinMutation(db, { label: "X", icon: "star", href: "javascript:alert(1)" })).toEqual({
    ok: false,
    error: "Use um caminho que comece com / ou um endereço http:// ou https://.",
  });
  expect(addPinMutation(db, { label: " ", icon: "star", href: "/" })).toEqual({ ok: false, error: "Informe um nome." });
  expect(addPinMutation(db, { label: "X", icon: "rocket", href: "/" })).toEqual({
    ok: false,
    error: "Escolha um ícone da lista.",
  });
});

test("removing closes the gap and moving swaps neighbors", () => {
  pin("A");
  pin("B");
  pin("C");
  const [a, b] = listPins(db);
  expect(removePinMutation(db, a.id).ok).toBe(true);
  expect(listPins(db).map((p) => [p.label, p.position])).toEqual([
    ["B", 0],
    ["C", 1],
  ]);
  expect(movePinMutation(db, b.id, "later").ok).toBe(true);
  expect(listPins(db).map((p) => p.label)).toEqual(["C", "B"]);
  expect(movePinMutation(db, b.id, "later")).toEqual({ ok: false, error: "Este atalho já está na ponta." });
});

test("each change returns the layout before and after and is logged", () => {
  const r = pin("A");
  expect(r.ok && r.data.before.pins).toEqual([]);
  expect(r.ok && r.data.after.pins.map((p) => p.label)).toEqual(["A"]);
  expect(listActivity(db).map((e) => e.summary)).toEqual(["Atalho “A” fixado"]);
});

test("sortPinsByUsage orders by open count, ties by manual position", () => {
  pin("A", "/a");
  pin("B", "/b");
  pin("C", "/c");
  const sorted = sortPinsByUsage(listPins(db), new Map([["/c", 5], ["/b", 5], ["/a", 1]]));
  expect(sorted.map((p) => p.label)).toEqual(["B", "C", "A"]);
});
