import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { menuBlocks } from "./menu/schema";
import { tasks } from "./tasks/schema";

// Tables listed here can be downloaded from /api/export/<name>?format=csv|json
export const exportable: Record<string, SQLiteTable> = {
  tasks,
  menu_blocks: menuBlocks,
};
