"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import type { ActionResult } from "@/lib/result";
import { updateSettingMutation } from "./mutations";
import { TEXT_SIZE_COOKIE, THEME_COOKIE } from "./validation";

const ONE_YEAR = 60 * 60 * 24 * 365;

// app_settings is the source of truth; theme and text size are also written to cookies so the
// inline script in layout.tsx applies them before first paint (next docs: preventing-flash-before-hydration).
export async function updateSettingAction(key: unknown, value: unknown): Promise<ActionResult> {
  const result = updateSettingMutation(db, key, value);
  if (!result.ok) return result;
  const cookieName =
    result.data.key === "theme" ? THEME_COOKIE : result.data.key === "text_size" ? TEXT_SIZE_COOKIE : null;
  if (cookieName) {
    (await cookies()).set(cookieName, String(result.data.value), { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  refresh();
  return { ok: true };
}
