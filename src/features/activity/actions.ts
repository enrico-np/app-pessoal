"use server";

import { refresh } from "next/cache";
import { db } from "@/db/client";
import { isValidHref } from "@/lib/href";
import { logActivity } from "./log";

// Called by PinLink on every tap of a pin (spec 003). refresh() re-renders Início so that, with
// "Ordenar pelos mais usados" on, the new order shows when the user comes back from an external link.
export async function logPinOpenAction(href: unknown): Promise<void> {
  if (typeof href !== "string" || href.length > 2000 || !isValidHref(href)) return;
  logActivity(db, { kind: "open", featureKey: "home", action: "pin.open", summary: href, targetHref: href });
  refresh();
}
