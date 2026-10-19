import type { z } from "zod";

// Return shapes of mutations. Inputs come from the client as `unknown`, so failures carry a pt-BR message.
export type Failure = { ok: false; error: string };
export type ActionResult = { ok: true } | Failure;
export type DataResult<T> = { ok: true; data: T } | Failure;

export function fail(error: string): Failure {
  return { ok: false, error };
}

export function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dados inválidos.";
}
