import { z } from "zod";
import type { Db } from "@/db/types";
import { addBlock, changeCounter, moveBlock, removeBlock, updateBlock } from "./queries";
import { blockUpdateSchema, newBlockSchema } from "./validation";

// Validation + query for each write, without Next.js APIs, so tests can call them.
// actions.ts wraps these as Server Actions. Inputs are `unknown` because they arrive from the client.

export type ActionResult = { ok: true } | { ok: false; error: string };

const id = z.int().positive();
const NOT_FOUND = "Bloco não encontrado.";
const fail = (error: string): ActionResult => ({ ok: false, error });

function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}

export function createBlockMutation(db: Db, cardKeys: readonly string[], input: unknown): ActionResult {
  const parsed = newBlockSchema(cardKeys).safeParse(input);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  addBlock(db, parsed.data);
  return { ok: true };
}

export function updateBlockMutation(
  db: Db,
  cardKeys: readonly string[],
  blockId: unknown,
  update: unknown,
): ActionResult {
  const parsedId = id.safeParse(blockId);
  if (!parsedId.success) return fail(NOT_FOUND);
  const parsed = blockUpdateSchema.safeParse(update);
  if (!parsed.success) return fail(firstMessage(parsed.error));
  try {
    return updateBlock(db, parsedId.data, parsed.data, cardKeys) ? { ok: true } : fail(NOT_FOUND);
  } catch (e) {
    if (e instanceof z.ZodError) return fail(firstMessage(e));
    throw e;
  }
}

export function removeBlockMutation(db: Db, blockId: unknown): ActionResult {
  const parsedId = id.safeParse(blockId);
  if (!parsedId.success) return fail(NOT_FOUND);
  return removeBlock(db, parsedId.data) ? { ok: true } : fail(NOT_FOUND);
}

// Moving past either end is not an error: the block stays where it is.
export function moveBlockMutation(db: Db, blockId: unknown, direction: unknown): ActionResult {
  const parsedId = id.safeParse(blockId);
  const parsedDir = z.enum(["earlier", "later"]).safeParse(direction);
  if (!parsedId.success || !parsedDir.success) return fail(NOT_FOUND);
  moveBlock(db, parsedId.data, parsedDir.data);
  return { ok: true };
}

export function changeCounterMutation(db: Db, blockId: unknown, delta: unknown): ActionResult {
  const parsedId = id.safeParse(blockId);
  const parsedDelta = z.union([z.literal(1), z.literal(-1)]).safeParse(delta);
  if (!parsedId.success || !parsedDelta.success) return fail(NOT_FOUND);
  return changeCounter(db, parsedId.data, parsedDelta.data) === undefined ? fail(NOT_FOUND) : { ok: true };
}
