import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { activityLog } from "./activity/schema";
import { homeGroups, homePanels, homePins } from "./home/schema";
import { appSettings } from "./settings/schema";
import { tasks } from "./tasks/schema";

// Tables listed here can be downloaded from /api/export/<name>?format=csv|json
export const exportable: Record<string, SQLiteTable> = {
  tasks,
  home_pins: homePins,
  home_panels: homePanels,
  home_groups: homeGroups,
  app_settings: appSettings,
  activity_log: activityLog,
};
