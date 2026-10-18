import { beforeEach, describe, expect, test } from "vitest";
import type { Db } from "@/db/types";
import {
  changeCounterMutation,
  createBlockMutation,
  moveBlockMutation,
  removeBlockMutation,
  updateBlockMutation,
} from "@/features/menu/mutations";
import { getBlock, listBlocks } from "@/features/menu/queries";
import { createTestDb } from "./helpers/db";

const cardKeys = ["open-tasks"];
let db: Db;
beforeEach(() => {
  db = createTestDb();
});

function addNote(label: string): number {
  expect(createBlockMutation(db, cardKeys, { type: "note", label, config: { text: "" } })).toEqual({ ok: true });
  return listBlocks(db).at(-1)!.id;
}

describe("createBlockMutation", () => {
  test("returns the first pt-BR validation message and writes nothing", () => {
    const r = createBlockMutation(db, cardKeys, { type: "shortcut", label: "", config: { href: "/x" } });
    expect(r).toEqual({ ok: false, error: "Informe um nome." });
    expect(listBlocks(db)).toEqual([]);
  });

  test("rejects non-object input", () => {
    expect(createBlockMutation(db, cardKeys, "x").ok).toBe(false);
  });
});

describe("updateBlockMutation", () => {
  test("returns a validation message for bad config instead of throwing", () => {
    createBlockMutation(db, cardKeys, { type: "shortcut", label: "S", config: { href: "/x" } });
    const id = listBlocks(db)[0].id;
    expect(updateBlockMutation(db, cardKeys, id, { config: { href: "javascript:alert(1)" } })).toEqual({
      ok: false,
      error: "Use um caminho que comece com / ou um endereço http:// ou https://.",
    });
  });

  test("not found for missing or malformed ids", () => {
    expect(updateBlockMutation(db, cardKeys, 999, { label: "X" })).toEqual({
      ok: false,
      error: "Bloco não encontrado.",
    });
    expect(updateBlockMutation(db, cardKeys, "1", { label: "X" }).ok).toBe(false);
  });

  test("renames a block", () => {
    const id = addNote("A");
    expect(updateBlockMutation(db, cardKeys, id, { label: "B" })).toEqual({ ok: true });
    expect(getBlock(db, id)?.label).toBe("B");
  });
});

describe("remove, move and counter", () => {
  test("remove reports not found for missing ids", () => {
    expect(removeBlockMutation(db, 1).ok).toBe(false);
    const id = addNote("A");
    expect(removeBlockMutation(db, id)).toEqual({ ok: true });
  });

  test("move at an end is ok and changes nothing; a bad direction is rejected", () => {
    const id = addNote("A");
    expect(moveBlockMutation(db, id, "earlier")).toEqual({ ok: true });
    expect(moveBlockMutation(db, id, "sideways").ok).toBe(false);
  });

  test("counter accepts only +1 and -1", () => {
    createBlockMutation(db, cardKeys, { type: "counter", label: "C" });
    const id = listBlocks(db)[0].id;
    expect(changeCounterMutation(db, id, 1)).toEqual({ ok: true });
    expect(changeCounterMutation(db, id, 5).ok).toBe(false);
    expect(getBlock(db, id)?.config).toEqual({ value: 1 });
  });

  test("counter on a non-counter block is not found", () => {
    const id = addNote("A");
    expect(changeCounterMutation(db, id, 1).ok).toBe(false);
  });
});
