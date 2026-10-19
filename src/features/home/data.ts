import "server-only";
import { connection } from "next/server";
import { db } from "@/db/client";
import { pinOpenCountsSince } from "@/features/activity/queries";
import { getSettings } from "@/features/settings/queries";
import { getLayout, listPins, sortPinsByUsage } from "./queries";

const USAGE_WINDOW_DAYS = 7;

// Reads for rendering. connection() keeps them out of build-time prerendering (see CLAUDE.md).

// Pins in the order Início shows them: manual, or by pin taps in the last 7 days when pins_order is "usage".
export async function readPins() {
  await connection();
  const pins = listPins(db);
  if (getSettings(db).pins_order !== "usage") return pins;
  const since = new Date(Date.now() - USAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return sortPinsByUsage(pins, pinOpenCountsSince(db, since));
}

export async function readLayout() {
  await connection();
  return getLayout(db);
}
