"use client";

import { ChevronDown, ChevronRight, Database, Download, Moon, Pencil, Settings as Gear, Type } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dialog, IconButton, SegmentedControl, Switch } from "@/components/ui";
import { formatShortDate, formatTime } from "@/lib/format";
import { updateSettingAction } from "../actions";
import type { Settings, TextSize } from "../validation";

const TEXT_SIZES: { value: TextSize; label: string; ariaLabel: string; className: string }[] = [
  { value: "sm", label: "A", ariaLabel: "Texto pequeno", className: "text-xs font-bold" },
  { value: "md", label: "A", ariaLabel: "Texto normal", className: "text-base font-bold" },
  { value: "lg", label: "A", ariaLabel: "Texto grande", className: "text-lg font-bold" },
];

const card = "overflow-hidden rounded-card border-2 border-border bg-surface shadow-hard";
const rowLink = "flex min-h-14 items-center gap-3 px-4 py-2 text-sm [&>svg]:size-5 [&>svg]:shrink-0";

// Gear menu (spec 002, design board E3). Opened from the teal header on Início.
export function SettingsSheet({
  settings,
  tables,
  version,
}: {
  settings: Pick<Settings, "theme" | "text_size" | "last_backup_at">;
  tables: string[];
  version: string;
}) {
  const [open, setOpen] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(key: "theme" | "text_size", value: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateSettingAction(key, value);
      if (!result.ok) return setError(result.error);
      // The cookie is written by the action; apply now so the change is visible without a reload.
      const attr = key === "theme" ? "data-theme" : "data-text-size";
      document.documentElement.setAttribute(attr, value);
    });
  }

  const lastBackup = settings.last_backup_at ? new Date(settings.last_backup_at) : null;

  return (
    <>
      <IconButton label="Ajustes" onClick={() => setOpen(true)}>
        <Gear aria-hidden="true" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ajustes">
        <div className="flex flex-col gap-4">
          <Link
            href="/editar"
            onClick={() => setOpen(false)}
            className="flex min-h-14 items-center gap-3 rounded-card border-2 border-border bg-accent px-4 font-bold text-accent-foreground shadow-hard [&>svg]:size-5"
          >
            <Pencil aria-hidden="true" />
            <span className="flex-1">Editar início</span>
            <ChevronRight aria-hidden="true" />
          </Link>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-[0.06em] text-muted uppercase">Aparência</h3>
            <div className={card}>
              <Switch
                icon={<Moon aria-hidden="true" />}
                label="Modo escuro"
                description={settings.theme === "system" ? "Segue o aparelho até você escolher" : undefined}
                checked={settings.theme === "dark"}
                disabled={pending}
                onChange={(on) => save("theme", on ? "dark" : "light")}
              />
              <div className="flex min-h-14 items-center gap-3 border-t-2 border-border py-1.5 pr-3 pl-4 text-sm">
                <Type aria-hidden="true" className="size-5 shrink-0" />
                <span className="flex-1 font-bold">Tamanho do texto</span>
                <SegmentedControl
                  label="Tamanho do texto"
                  options={TEXT_SIZES}
                  value={settings.text_size}
                  disabled={pending}
                  onChange={(v) => save("text_size", v)}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold tracking-[0.06em] text-muted uppercase">Seus dados</h3>
            <div className={card}>
              <button
                type="button"
                aria-expanded={showTables}
                onClick={() => setShowTables(!showTables)}
                className={`${rowLink} w-full text-left`}
              >
                <Download aria-hidden="true" />
                <span className="flex flex-1 flex-col">
                  <span className="font-bold">Exportar dados</span>
                  <span className="text-xs text-muted">CSV para Excel ou JSON</span>
                </span>
                <ChevronDown aria-hidden="true" className={showTables ? "rotate-180" : undefined} />
              </button>
              {showTables && (
                <ul className="border-t-2 border-border px-4 py-1">
                  {tables.map((t) => (
                    <li key={t} className="flex min-h-tap items-center gap-3 text-sm">
                      <span className="flex-1 font-mono text-xs">{t}</span>
                      <a href={`/api/export/${t}?format=csv`} download className="px-2 py-3 font-bold text-link underline">
                        CSV
                      </a>
                      <a href={`/api/export/${t}?format=json`} download className="px-2 py-3 font-bold text-link underline">
                        JSON
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <a
                href="/api/backup"
                download
                onClick={() => setTimeout(() => router.refresh(), 1000)}
                className={`${rowLink} border-t-2 border-border`}
              >
                <Database aria-hidden="true" />
                <span className="flex flex-1 flex-col">
                  <span className="font-bold">Fazer backup</span>
                  <span className="text-xs text-muted">
                    {lastBackup ? `Último: ${formatShortDate(lastBackup)}, ${formatTime(lastBackup)}` : "Nenhum backup ainda"}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" />
              </a>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <p className="text-center text-xs text-muted">App Pessoal · versão {version}</p>
        </div>
      </Dialog>
    </>
  );
}
