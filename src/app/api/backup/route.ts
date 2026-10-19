import { db } from "@/db/client";
import { setSetting } from "@/features/settings/queries";
import { toIsoDay } from "@/lib/calendar";

// Downloads a copy of the whole SQLite database (Ajustes › Fazer backup) and records when it was made.
// better-sqlite3 serialize() reads through SQLite's pager, so rows still in the WAL file are included
// (checked by e2e/settings.spec.ts, which opens the downloaded file and reads a row written just before).
export async function GET() {
  const bytes = db.$client.serialize();
  const now = new Date();
  setSetting(db, "last_backup_at", now.getTime());
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": "application/vnd.sqlite3",
      "content-disposition": `attachment; filename="app-pessoal-${toIsoDay(now)}.db"`,
      "cache-control": "no-store",
    },
  });
}
