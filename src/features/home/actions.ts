"use server";

import { refresh } from "next/cache";
import { db } from "@/db/client";
import type { ActionResult } from "@/lib/result";
import { changeCounterMutation, saveEditSessionMutation } from "./mutations";

// Server Actions for Início. No auth: the app runs locally for one user (login is out of scope).
// refresh() re-renders the current page; reads are not cached, so there is nothing to revalidate.

function done(result: ActionResult): ActionResult {
  if (result.ok) refresh();
  return result;
}

export async function saveEditSessionAction(session: unknown) {
  return done(saveEditSessionMutation(db, session));
}

export async function changeCounterAction(id: unknown, delta: unknown) {
  return done(changeCounterMutation(db, id, delta));
}
