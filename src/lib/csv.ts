// Brazilian Excel format: ";" as separator, "," as decimal mark, UTF-8 BOM so accents open correctly.
const BOM = "﻿";

function cell(v: unknown): string {
  if (v == null) return "";
  const s =
    v instanceof Date ? v.toISOString() : typeof v === "number" ? String(v).replace(".", ",") : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const lines = [cols.join(";"), ...rows.map((r) => cols.map((c) => cell(r[c])).join(";"))];
  return BOM + lines.join("\n");
}
