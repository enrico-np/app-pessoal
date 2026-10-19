import { expect, test } from "vitest";
import { addPin, draftFromLayout, movePin, removePin, updatePin, type Draft } from "@/features/home/draft";
import { sortPinsByUsage } from "@/features/home/queries";
import type { HomePinRow } from "@/features/home/schema";

const empty = (): Draft =>
  draftFromLayout({ pins: [], panels: [], groups: [] }, { pins_order: "manual", history_count: 3 });

function withPins(...labels: string[]): Draft {
  let d = empty();
  for (const label of labels) {
    const r = addPin(d, { label, icon: "star", href: `/${label.toLowerCase()}` });
    if (!r.ok) throw new Error(r.error);
    d = r.data;
  }
  return d;
}

test("up to 8 pins; the 9th is rejected with a pt-BR message", () => {
  const d = withPins("P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8");
  expect(d.pins).toHaveLength(8);
  expect(addPin(d, { label: "P9", icon: "star", href: "/" })).toEqual({
    ok: false,
    error: "Você já fixou 8 atalhos. Remova um para fixar outro.",
  });
});

test("href, label and icon are validated", () => {
  const d = empty();
  expect(addPin(d, { label: "X", icon: "star", href: "javascript:alert(1)" })).toEqual({
    ok: false,
    error: "Use um caminho que comece com / ou um endereço http:// ou https://.",
  });
  expect(addPin(d, { label: " ", icon: "star", href: "/" })).toEqual({ ok: false, error: "Informe um nome." });
  expect(addPin(d, { label: "X", icon: "rocket", href: "/" })).toEqual({ ok: false, error: "Escolha um ícone da lista." });
});

test("new pins get temporary negative ids and each change is listed", () => {
  const d = withPins("A", "B");
  expect(d.pins.map((p) => p.id)).toEqual([-1, -2]);
  expect(d.changes).toEqual(["Atalho “A” fixado", "Atalho “B” fixado"]);
});

test("move works like drag and drop; remove and update record a change", () => {
  let d = withPins("A", "B", "C");
  const moved = movePin(d, 0, 2);
  if (!moved.ok) throw new Error(moved.error);
  d = moved.data;
  expect(d.pins.map((p) => p.label)).toEqual(["B", "C", "A"]);
  expect(d.changes.at(-1)).toBe("Atalho “A” movido");

  const removed = removePin(d, d.pins[0].id);
  expect(removed.ok && removed.data.pins.map((p) => p.label)).toEqual(["C", "A"]);
  expect(removed.ok && removed.data.changes.at(-1)).toBe("Atalho “B” removido");

  const updated = updatePin(d, d.pins[0].id, { label: "Bê", icon: "heart", href: "https://example.com" });
  expect(updated.ok && updated.data.pins[0]).toEqual({ id: d.pins[0].id, label: "Bê", icon: "heart", href: "https://example.com" });
});

test("no-op steps return the same draft and add no change", () => {
  const d = withPins("A", "B");
  expect(movePin(d, 1, 1)).toEqual({ ok: true, data: d });
  const same = updatePin(d, d.pins[0].id, { label: "A", icon: "star", href: "/a" });
  expect(same.ok && same.data).toBe(d);
});

test("sortPinsByUsage orders by tap count, ties by manual position", () => {
  const pin = (id: number, href: string, position: number): HomePinRow => ({
    id,
    label: href,
    icon: "star",
    href,
    position,
    createdAt: new Date(0),
  });
  const pins = [pin(1, "/a", 0), pin(2, "/b", 1), pin(3, "/c", 2)];
  const sorted = sortPinsByUsage(pins, new Map([["/c", 5], ["/b", 5], ["/a", 1]]));
  expect(sorted.map((p) => p.href)).toEqual(["/b", "/c", "/a"]);
});
