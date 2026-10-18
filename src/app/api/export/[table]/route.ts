import type { NextRequest } from "next/server";
import { db } from "@/db/client";
import { exportable } from "@/features/registry";
import { toCsv } from "@/lib/csv";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/export/[table]">) {
  const { table } = await ctx.params;
  const target = exportable[table];
  if (!target) return Response.json({ error: "unknown table" }, { status: 404 });

  const rows = (await db.select().from(target)) as Record<string, unknown>[];
  const format = req.nextUrl.searchParams.get("format") ?? "csv";

  if (format === "json") return Response.json(rows);
  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${table}.csv"`,
    },
  });
}
