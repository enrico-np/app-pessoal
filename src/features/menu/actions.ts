"use server";

import { refresh } from "next/cache";
import { db } from "@/db/client";
import { cardKeys } from "./cards";
import {
  changeCounterMutation,
  createBlockMutation,
  moveBlockMutation,
  removeBlockMutation,
  updateBlockMutation,
  type ActionResult,
} from "./mutations";

// Server Actions for the menu. No auth: the app runs locally for one user (spec 001 lists login as out of scope).
// refresh() re-renders the current page; reads are not cached, so there is nothing to revalidate.

function done(result: ActionResult): ActionResult {
  if (result.ok) refresh();
  return result;
}

export async function createBlockAction(input: unknown) {
  return done(createBlockMutation(db, cardKeys, input));
}

export async function updateBlockAction(blockId: unknown, update: unknown) {
  return done(updateBlockMutation(db, cardKeys, blockId, update));
}

export async function removeBlockAction(blockId: unknown) {
  return done(removeBlockMutation(db, blockId));
}

export async function moveBlockAction(blockId: unknown, direction: unknown) {
  return done(moveBlockMutation(db, blockId, direction));
}

export async function changeCounterAction(blockId: unknown, delta: unknown) {
  return done(changeCounterMutation(db, blockId, delta));
}
