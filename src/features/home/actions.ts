"use server";

import { refresh } from "next/cache";
import { db } from "@/db/client";
import { featureLabel } from "@/features/catalog";
import type { ActionResult } from "@/lib/result";
import {
  addPanelMutation,
  addPinMutation,
  changeCounterMutation,
  movePanelMutation,
  movePinMutation,
  moveGroupMutation,
  removePanelMutation,
  removePinMutation,
  restoreLayoutMutation,
  updatePanelMutation,
  updatePinMutation,
  type EditResult,
} from "./mutations";

// Server Actions for Início. No auth: the app runs locally for one user (login is out of scope).
// refresh() re-renders the current page; reads are not cached, so there is nothing to revalidate.

function done<T extends ActionResult | EditResult>(result: T): T {
  if (result.ok) refresh();
  return result;
}

export async function addPinAction(input: unknown) {
  return done(addPinMutation(db, input));
}

export async function updatePinAction(id: unknown, input: unknown) {
  return done(updatePinMutation(db, id, input));
}

export async function removePinAction(id: unknown) {
  return done(removePinMutation(db, id));
}

export async function movePinAction(id: unknown, direction: unknown) {
  return done(movePinMutation(db, id, direction));
}

export async function addPanelAction(input: unknown) {
  return done(addPanelMutation(db, input));
}

export async function updatePanelAction(id: unknown, update: unknown) {
  return done(updatePanelMutation(db, id, update));
}

export async function removePanelAction(id: unknown) {
  return done(removePanelMutation(db, id));
}

export async function movePanelAction(id: unknown, direction: unknown) {
  return done(movePanelMutation(db, id, direction));
}

export async function moveGroupAction(groupKey: unknown, direction: unknown) {
  return done(moveGroupMutation(db, groupKey, direction, featureLabel(String(groupKey))));
}

export async function restoreLayoutAction(layout: unknown, kind: unknown) {
  return done(restoreLayoutMutation(db, layout, kind === "redo" ? "redo" : "undo"));
}

export async function changeCounterAction(id: unknown, delta: unknown) {
  return done(changeCounterMutation(db, id, delta));
}
