"use server";

import { z } from "zod";
import { db } from "@/db/client";
import { isValidHref } from "@/lib/href";
import { logActivity } from "./log";

// No refresh(): an "open" row changes nothing on the current screen.

const path = z.string().max(500).refine((p) => p.startsWith("/") && !p.startsWith("//"));

// Called by TrackVisit on every client-side page view of an internal path.
export async function logVisitAction(pathname: unknown): Promise<void> {
  const parsed = path.safeParse(pathname);
  if (!parsed.success) return;
  logActivity(db, { kind: "open", featureKey: "visit", action: "page.open", summary: parsed.data, targetHref: parsed.data });
}

// External URLs are not page views of this app, so pins log them when tapped.
export async function logExternalOpenAction(href: unknown): Promise<void> {
  if (typeof href !== "string" || href.startsWith("/") || !isValidHref(href)) return;
  logActivity(db, { kind: "open", featureKey: "visit", action: "link.open", summary: href, targetHref: href });
}
