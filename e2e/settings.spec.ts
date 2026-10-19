import Database from "better-sqlite3";
import { expect, test } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearDb, execSql } from "./helpers";

// Browser checks for spec 002 "Done when" (Ajustes). Viewport is 360 x 740.

test.beforeEach(async ({ page }) => {
  clearDb();
  await page.goto("/");
  await page.getByRole("button", { name: "Ajustes" }).click();
});

test("Modo escuro applies at once and persists after a reload", async ({ page }) => {
  const html = page.locator("html");
  await page.getByRole("switch", { name: /Modo escuro/ }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe("rgb(15, 28, 30)");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Ajustes" }).click();
  await expect(page.getByRole("switch", { name: /Modo escuro/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("switch", { name: /Modo escuro/ }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("Tamanho do texto applies at once and persists after a reload", async ({ page }) => {
  await page.getByRole("radio", { name: "Texto grande" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "lg");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe("18px");
});

test("Exportar dados lists every registered table in CSV (Brazilian Excel) and JSON", async ({ page, request }) => {
  await page.getByRole("button", { name: /Exportar dados/ }).click();
  const dialog = page.getByRole("dialog");
  for (const table of ["tasks", "home_pins", "home_panels", "home_groups", "app_settings", "activity_log"]) {
    await expect(dialog.getByText(table, { exact: true })).toBeVisible();
  }
  execSql("INSERT INTO tasks (title, created_at) VALUES ('Exportada; com ponto e vírgula', 1)");
  const csv = await request.get("/api/export/tasks?format=csv");
  const body = await csv.text();
  expect(body.charCodeAt(0)).toBe(0xfeff);
  expect(body).toContain("id;title;done;createdAt");
  expect(body).toContain('"Exportada; com ponto e vírgula"');
  const json = await request.get("/api/export/tasks?format=json");
  expect((await json.json())[0].title).toBe("Exportada; com ponto e vírgula");
});

test("Fazer backup downloads a database that opens in SQLite and records the date", async ({ page }) => {
  execSql("INSERT INTO tasks (title, created_at) VALUES ('Antes do backup', 1)");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /Fazer backup/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^app-pessoal-\d{4}-\d{2}-\d{2}\.db$/);
  const file = join(mkdtempSync(join(tmpdir(), "backup-")), "copy.db");
  await download.saveAs(file);
  const copy = new Database(file, { readonly: true });
  expect(copy.prepare("SELECT title FROM tasks").all()).toEqual([{ title: "Antes do backup" }]);
  copy.close();

  await page.reload();
  await page.getByRole("button", { name: "Ajustes" }).click();
  await expect(page.getByRole("link", { name: /Fazer backup/ })).toContainText("Último:");
});
