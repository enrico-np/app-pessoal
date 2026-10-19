import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "./schema";

// Query functions take the database as a parameter so tests can pass an in-memory one.
export type Db = BetterSQLite3Database<typeof schema>;

// A transaction handle. Functions that may run inside another function's transaction accept DbOrTx.
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbOrTx = Db | Tx;
