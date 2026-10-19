import { exportable } from "@/features/registry";
import { readSettings } from "../data";
import { SettingsSheet } from "./SettingsSheet";
import pkg from "../../../../package.json";

// Server part of the gear: reads settings and passes plain values to the sheet.
export async function SettingsButton() {
  const s = await readSettings();
  return (
    <SettingsSheet
      settings={{ theme: s.theme, text_size: s.text_size, last_backup_at: s.last_backup_at }}
      tables={Object.keys(exportable)}
      version={pkg.version}
    />
  );
}
