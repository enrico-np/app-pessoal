import { expect, test } from "@playwright/test";
import { addActivity, clearDb, expectNoHorizontalScroll, expectTapTargets } from "./helpers";

// Browser checks for spec 002 "Done when" (Histórico page and period filter). Viewport is 360 x 740.

test.beforeEach(() => {
  clearDb();
  addActivity("tasks", "Tarefa hoje", 0, 9);
  addActivity("general", "Contador ontem", 1);
  addActivity("tasks", "Tarefa há 5 dias", 5);
  addActivity("tasks", "Tarefa há 40 dias", 40);
});

const sections = (page: import("@playwright/test").Page) => page.locator("main section h2");
const entries = (page: import("@playwright/test").Page) => page.locator("main section li");

test("groups entries by day, newest first, and marks Histórico as current", async ({ page }) => {
  await page.goto("/historico");
  await expect(page.getByRole("heading", { name: "Histórico", level: 1 })).toBeVisible();
  await expect(sections(page).nth(0)).toHaveText("Hoje");
  await expect(sections(page).nth(1)).toHaveText("Ontem");
  await expect(entries(page)).toHaveCount(4);
  await expect(entries(page).first()).toContainText("Tarefa hoje");
  await expect(entries(page).first()).toContainText("Tarefas · 09:00");
  await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Histórico" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("feature chips filter and the filter survives a reload through the URL", async ({ page }) => {
  await page.goto("/historico");
  await page.getByRole("link", { name: "Geral", exact: true }).click();
  await expect(page).toHaveURL(/feature=general/);
  await expect(entries(page)).toHaveCount(1);
  await page.reload();
  await expect(entries(page)).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Geral", exact: true })).toHaveAttribute("aria-current", "true");
});

test("period shortcut 7 dias keeps the feature filter and can be cleared", async ({ page }) => {
  await page.goto("/historico?feature=tasks");
  await page.getByRole("button", { name: "Filtrar por período" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Últimos 7 dias" }).click();
  await dialog.getByRole("button", { name: "Mostrar", exact: true }).click();
  await expect(page).toHaveURL(/periodo=7d/);
  await expect(page).toHaveURL(/feature=tasks/);
  await expect(page.getByText("Últimos 7 dias")).toBeVisible();
  await expect(entries(page)).toHaveCount(2);
  await page.reload();
  await expect(entries(page)).toHaveCount(2);
  await page.getByRole("link", { name: "Limpar período" }).click();
  await expect(entries(page)).toHaveCount(3);
});

test("custom range picked on the calendar is inclusive and future days are disabled", async ({ page }) => {
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
  };
  const sameMonth = new Date().getDate() > 1;
  test.skip(!sameMonth, "the range below needs yesterday and today in the same month");

  await page.goto("/historico");
  await page.getByRole("button", { name: "Filtrar por período" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: day(1), exact: true }).click();
  await dialog.getByRole("button", { name: day(0), exact: true }).click();
  await dialog.getByRole("button", { name: /^Mostrar / }).click();
  await expect(page).toHaveURL(/de=\d{4}-\d{2}-\d{2}&ate=\d{4}-\d{2}-\d{2}/);
  await expect(entries(page)).toHaveCount(2);

  await page.getByRole("button", { name: "Filtrar por período" }).click();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getMonth() === new Date().getMonth()) {
    await expect(dialog.getByRole("button", { name: day(-1), exact: true })).toBeDisabled();
  }
  await expect(dialog.getByRole("button", { name: "Próximo mês" })).toBeDisabled();
});

test("360 px: no horizontal scroll and tap targets of at least 44 px", async ({ page }) => {
  await page.goto("/historico");
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
  await page.getByRole("button", { name: "Filtrar por período" }).click();
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page, "dialog[open]");
});
