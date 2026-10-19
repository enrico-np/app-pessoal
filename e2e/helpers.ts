import Database from "better-sqlite3";
import { expect, type Page } from "@playwright/test";

const DB_PATH = "./data/e2e.db";

// Empties every table the tests touch. The server keeps its own connection; SQLite WAL makes the change visible.
export function clearDb() {
  execSql(
    "DELETE FROM home_pins; DELETE FROM home_panels; DELETE FROM home_groups; DELETE FROM app_settings; DELETE FROM activity_log; DELETE FROM tasks;",
  );
}

// Runs SQL directly against the e2e database, for setting up data the UI has no form for yet.
export function execSql(sql: string, params: unknown[] = []) {
  const db = new Database(DB_PATH);
  if (params.length) db.prepare(sql).run(...params);
  else db.exec(sql);
  db.close();
}

export function querySql<T>(sql: string): T[] {
  const db = new Database(DB_PATH, { readonly: true });
  const rows = db.prepare(sql).all() as T[];
  db.close();
  return rows;
}

// An activity entry at a given local day offset from today (0 = today, 1 = yesterday) and hour.
export function addActivity(featureKey: string, summary: string, daysAgo: number, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  execSql(
    "INSERT INTO activity_log (kind, feature_key, action, summary, target_href, created_at) VALUES ('change', ?, 'test', ?, '/', ?)",
    [featureKey, summary, d.getTime()],
  );
}

export function count(sql: string): number {
  return querySql<{ n: number }>(sql)[0].n;
}

export async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

// Every visible control must be at least 44 x 44 px. A checkbox or radio is measured by the label around it.
export async function expectTapTargets(page: Page, scope = "main") {
  const small = await page
    .locator(`${scope} button:visible, ${scope} a:visible, ${scope} select:visible, ${scope} input:visible`)
    .evaluateAll((els) =>
      els
        .map((e) => {
          const target = e.matches("input[type=checkbox], input[type=radio]") ? (e.closest("label") ?? e) : e;
          return { name: e.getAttribute("aria-label") ?? e.textContent?.trim() ?? e.tagName, r: target.getBoundingClientRect() };
        })
        .filter(({ r }) => r.height < 44 || r.width < 44)
        .map(({ name, r }) => `${name}: ${Math.round(r.width)}x${Math.round(r.height)}`),
    );
  expect(small).toEqual([]);
}

export async function openEditor(page: Page) {
  await page.goto("/editar");
  await expect(page.getByRole("heading", { name: "Editando o início" })).toBeVisible();
}

// `destination` is a page name from the "Destino" select (Início, Histórico) or a URL pasted as "Link".
export async function addPin(page: Page, label: string, destination: string) {
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  if (/^https?:/.test(destination)) {
    await dialog.getByLabel("Destino").selectOption({ label: "Link" });
    await dialog.getByRole("textbox", { name: "Link" }).fill(destination);
  } else {
    await dialog.getByLabel("Destino").selectOption({ label: destination });
  }
  await dialog.getByLabel("Nome").fill(label);
  await dialog.getByRole("button", { name: "Fixar" }).click();
  await expect(dialog).toBeHidden();
}

// Concluir in edit mode; waits until Início is shown again.
export async function finishEditing(page: Page) {
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Início", level: 1 })).toBeVisible();
}

// Keyboard drag (spec 003): focus the handle, Space to lift, arrows to move, Space to drop.
// dnd-kit starts listening for the arrow keys only after React re-renders the lifted item, so each step
// waits; key presses sent back to back arrive before the listener exists and are lost.
export async function keyboardMove(page: Page, handleName: string, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", times = 1) {
  const handle = page.getByRole("button", { name: handleName, exact: true });
  await handle.focus();
  await page.keyboard.press("Space");
  await expect(handle).toHaveAttribute("aria-pressed", "true");
  for (let i = 0; i < times; i++) {
    await page.waitForTimeout(100);
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(250); // the drop animation of the last step
  await page.keyboard.press("Space");
  await expect(handle).not.toHaveAttribute("aria-pressed", "true");
}

export function pinLabels(page: Page, scope: "edit" | "home") {
  return scope === "edit"
    ? page.locator("[data-pin]").evaluateAll((els) => els.map((e) => e.getAttribute("data-pin") ?? ""))
    : page
        .locator("section[aria-labelledby=fixados] li")
        .evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace("(abre em nova aba)", "").trim()));
}

// Top-level rows of an activity list (an edit session row has its own nested <li> items).
export function activityRows(page: Page, scope: string) {
  return page.locator(`${scope} ul.rounded-card > li`);
}

export async function addPanel(
  page: Page,
  opts: { feature: "Tarefas" | "Geral"; type: string; size: "Pequeno" | "Médio" | "Grande"; name?: string; goal?: string; text?: string },
) {
  await page.getByRole("button", { name: "Adicionar painel", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: opts.feature, exact: true }).click();
  await dialog.getByRole("radio", { name: new RegExp(`^${opts.type}`) }).check();
  if (opts.name !== undefined) await dialog.getByLabel(opts.type === "Nota" ? "Título" : "Nome", { exact: true }).fill(opts.name);
  if (opts.goal !== undefined) await dialog.getByLabel("Meta do dia (opcional)").fill(opts.goal);
  if (opts.text !== undefined) await dialog.getByLabel("Texto", { exact: true }).fill(opts.text);
  await dialog.getByRole("radio", { name: opts.size, exact: true }).click();
  await dialog.getByRole("button", { name: "Adicionar ao início" }).click();
  await expect(dialog).toBeHidden();
}

// The edit screen's status line. getByRole("status") alone also matches <output> elements.
export function editStatus(page: Page) {
  return page.locator("main header [role=status]");
}

export async function panelTitles(page: Page): Promise<string[]> {
  return page.locator("[data-panel-title]").evaluateAll((els) => els.map((e) => e.getAttribute("data-panel-title") ?? ""));
}
