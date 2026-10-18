// Recreates the e2e database from the migrations before the test server starts.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { mkdirSync, rmSync } from "node:fs";

const path = process.env.DATABASE_PATH;
if (!path || !path.includes("e2e")) throw new Error(`Refusing to reset non-e2e database: ${path}`);
mkdirSync("data", { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) rmSync(path + suffix, { force: true });
const sqlite = new Database(path);
migrate(drizzle(sqlite), { migrationsFolder: "drizzle" });
sqlite.close();
