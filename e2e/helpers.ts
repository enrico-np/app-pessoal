import Database from "better-sqlite3";
import { expect, type Page } from "@playwright/test";

const DB_PATH = "./data/e2e.db";

// Empties the tables the menu tests touch. The server keeps its own connection; SQLite WAL makes the change visible.
export function clearDb() {
  const db = new Database(DB_PATH);
  db.exec("DELETE FROM menu_blocks; DELETE FROM tasks;");
  db.close();
}

export async function startEditing(page: Page) {
  await page.getByRole("button", { name: "Editar", exact: true }).click();
}

export async function addBlock(
  page: Page,
  opts: { type: "Atalho" | "Nota" | "Contador" | "Resumo"; label: string; href?: string; text?: string; value?: string },
) {
  await page.getByRole("button", { name: "Adicionar bloco" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tipo").selectOption({ label: opts.type });
  await dialog.getByLabel("Nome").fill(opts.label);
  if (opts.href !== undefined) await dialog.getByLabel("Endereço").fill(opts.href);
  if (opts.text !== undefined) await dialog.getByLabel("Texto").fill(opts.text);
  if (opts.value !== undefined) await dialog.getByLabel("Valor").fill(opts.value);
  await dialog.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(dialog).toBeHidden();
}

// Block labels in grid order (MenuGrid sets data-block-label on each item).
export async function blockLabels(page: Page): Promise<string[]> {
  return page.locator("[data-block-label]").evaluateAll((els) => els.map((e) => e.getAttribute("data-block-label") ?? ""));
}

// Runs SQL directly against the e2e database, for setting up data the UI has no form for yet.
export function execSql(sql: string) {
  const db = new Database(DB_PATH);
  db.exec(sql);
  db.close();
}
