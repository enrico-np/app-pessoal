import { expect, test } from "@playwright/test";
import {
  addPanel,
  addPin,
  clearDb,
  editStatus,
  execSql,
  expectNoHorizontalScroll,
  expectTapTargets,
  openEditor,
  panelTitles,
  querySql,
} from "./helpers";

// Browser checks for spec 002 "Done when" (Início, edit mode, panels). Viewport is 360 x 740.

test.beforeEach(() => {
  clearDb();
});

test("header shows title, pt-BR date and gear; the bar marks Início as current", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("heading", { name: "Início", level: 1 })).toBeVisible();
  const expected = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  await expect(header.getByText(expected)).toBeVisible();
  await expect(header.getByRole("button", { name: "Ajustes" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByText("Ferramentas")).toHaveAttribute("aria-disabled", "true");
  await expect(nav.getByRole("link", { name: "Ferramentas" })).toHaveCount(0);
});

test("empty database shows the empty state (E4)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Fixe até 6 atalhos")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Seu início está vazio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Adicionar primeiro painel" })).toBeVisible();
  await expect(page.getByText("Nada por aqui ainda.", { exact: false })).toBeVisible();
});

test("up to 6 pins; the add slot disappears at 6 and the row scrolls sideways at 360 px", async ({ page }) => {
  await openEditor(page);
  for (let i = 1; i <= 6; i++) await addPin(page, `Atalho ${i}`, `/a${i}`);
  await expect(page.getByRole("heading", { name: /Fixados · 6 de 6/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar", exact: true })).toHaveCount(0);

  await page.getByRole("link", { name: "Concluir" }).click();
  const row = page.locator("section[aria-labelledby=fixados] ul");
  const { scrollWidth, clientWidth } = await row.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(scrollWidth).toBeGreaterThan(clientWidth);
  await expectNoHorizontalScroll(page);
});

test("each panel type renders in each size it supports, under its group", async ({ page }) => {
  await openEditor(page);
  await addPanel(page, { feature: "Tarefas", type: "Tarefas abertas", size: "Grande" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Pequeno", name: "Água", goal: "8" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Café" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Grande", name: "Passos", goal: "3" });
  await addPanel(page, { feature: "Geral", type: "Nota", size: "Médio", name: "Lembrete", text: "Pagar luz" });
  await addPanel(page, { feature: "Geral", type: "Nota", size: "Grande", name: "Ideias" });
  execSql("INSERT INTO tasks (title, created_at) VALUES ('Pagar luz', 1), ('Dentista', 2)");

  await page.goto("/");
  await expect(page.locator("[data-group]")).toHaveCount(2);
  await expect(page.locator("[data-group=tasks] h3")).toHaveText("Tarefas");
  await expect(page.locator("[data-group=general] h3")).toHaveText("Geral");
  const sizes = await page
    .locator("[data-panel-title]")
    .evaluateAll((els) => els.map((e) => `${e.getAttribute("data-panel-title")}:${e.getAttribute("data-panel-size")}`));
  expect(sizes).toEqual([
    "Tarefas abertas:lg",
    "Água:sm",
    "Café:md",
    "Passos:lg",
    "Lembrete:md",
    "Ideias:lg",
  ]);
  // Large tasks panel lists the oldest open tasks with a checkbox that completes them.
  await page.getByRole("checkbox", { name: "Pagar luz" }).check();
  await expect(page.getByRole("checkbox", { name: "Pagar luz" })).toHaveCount(0);
  await expect(page.locator("[data-panel-title='Tarefas abertas']").getByText("1", { exact: true })).toBeVisible();
  // Small counter shows the goal, large counter shows goal cells.
  await expect(page.locator("[data-panel-title='Água']")).toContainText("0/8");
  await expect(page.locator("[data-panel-title='Passos']").getByRole("img", { name: "0 de 3" })).toBeVisible();

  // A single-instance type is disabled in the add sheet once used.
  await openEditor(page);
  await page.getByRole("button", { name: "Adicionar painel", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Tarefas", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("radio", { name: /^Tarefas abertas/ })).toBeDisabled();
});

test("a note offers only the sizes it supports", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Adicionar painel", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Geral", exact: true }).click();
  await dialog.getByRole("radio", { name: /^Nota/ }).check();
  await expect(dialog.getByRole("radio", { name: "Pequeno", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("radio", { name: "Médio", exact: true })).toBeVisible();
});

test("groups and panels can be reordered and the order survives a reload", async ({ page }) => {
  await openEditor(page);
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "A" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "B" });
  await addPanel(page, { feature: "Tarefas", type: "Tarefas abertas", size: "Médio" });

  await page.getByRole("button", { name: "Editar B" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "↑ Mover para cima" }).click();
  await expect(editStatus(page)).toHaveText("Última mudança: Painel “B” movido.");
  await page.getByRole("button", { name: "Mover grupo Tarefas para cima" }).click();
  await expect(editStatus(page)).toHaveText("Última mudança: Grupo “Tarefas” movido.");

  await page.goto("/");
  await page.reload();
  expect(await panelTitles(page)).toEqual(["Tarefas abertas", "B", "A"]);
});

test("Desfazer and Refazer revert and reapply changes; the stack clears on Concluir", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "Tarefas", "/");
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Água" });
  await addPanel(page, { feature: "Geral", type: "Nota", size: "Médio", name: "Nota 1" });

  // Remove happens at once (no confirmation) and can be undone.
  await page.getByRole("button", { name: "Remover Água" }).click();
  await expect(page.locator("[data-edit-panel]")).toHaveCount(1);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.locator("[data-edit-panel='Água']")).toBeVisible();
  await expect(editStatus(page)).toHaveText("Desfeito: Painel “Água” removido.");
  await page.getByRole("button", { name: "Refazer" }).click();
  await expect(page.locator("[data-edit-panel='Água']")).toHaveCount(0);

  // Size change and pin removal undo too.
  await page.getByRole("button", { name: "Editar Nota 1" }).click();
  await page.getByRole("dialog").getByRole("radio", { name: "Grande" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Nota · grande")).toBeVisible();
  await page.getByRole("button", { name: "Remover Tarefas" }).click();
  await expect(page.locator("[data-pin]")).toHaveCount(0);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.locator("[data-pin='Tarefas']")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("Nota · médio")).toBeVisible();

  await page.getByRole("link", { name: "Concluir" }).click();
  await openEditor(page);
  await expect(page.getByRole("button", { name: "Desfazer" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Refazer" })).toBeDisabled();
});

test("counter + and - work on Início, survive a reload and appear in Histórico", async ({ page }) => {
  await openEditor(page);
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Água" });
  await page.goto("/");
  const panel = page.locator("[data-panel-title='Água']");
  await panel.getByRole("button", { name: "Aumentar Água" }).click();
  await panel.getByRole("button", { name: "Aumentar Água" }).click();
  await panel.getByRole("button", { name: "Diminuir Água" }).click();
  await expect(panel.locator("output")).toHaveText("1");
  // The last tap is saved once its history entry appears; reloading earlier could cut the request.
  await expect(page.locator("section[aria-labelledby=historico] li").first()).toContainText("Água: 2 → 1");
  await page.reload();
  await expect(panel.locator("output")).toHaveText("1");
});

test("Histórico on Início shows the last N entries, N from the stepper", async ({ page }) => {
  await openEditor(page);
  for (const n of ["A", "B", "C", "D"]) await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: n });
  await page.getByRole("button", { name: "Mostrar mais itens" }).click();
  await expect(page.locator("#edit-historico ~ div output")).toHaveText("4");
  await page.goto("/");
  await expect(page.locator("section[aria-labelledby=historico] li")).toHaveCount(4);
  await expect(page.locator("section[aria-labelledby=historico] li").first()).toContainText("Painel “D” adicionado");
});

test("Ordenar pelos mais usados puts the most visited pin first", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "Início", "/");
  await addPin(page, "Histórico", "/historico");
  await page.getByRole("switch", { name: /Ordenar pelos mais usados/ }).click();
  await expect(page.getByRole("switch", { name: /Ordenar pelos mais usados/ })).toHaveAttribute("aria-checked", "true");
  execSql("DELETE FROM activity_log WHERE kind = 'open'");
  for (let i = 0; i < 3; i++) {
    execSql("INSERT INTO activity_log (kind, feature_key, action, summary, target_href, created_at) VALUES ('open', 'visit', 'page.open', '/historico', '/historico', ?)", [Date.now()]);
  }
  await page.goto("/");
  const labels = page.locator("section[aria-labelledby=fixados] li");
  await expect(labels.first()).toContainText("Histórico");

  await openEditor(page);
  await page.getByRole("switch", { name: /Ordenar pelos mais usados/ }).click();
  await page.goto("/");
  await expect(labels.first()).toContainText("Início");
});

test("visiting a page records an open entry", async ({ page }) => {
  await page.goto("/historico");
  await expect
    .poll(
      () => querySql<{ n: number }>("SELECT COUNT(*) AS n FROM activity_log WHERE kind = 'open' AND target_href = '/historico'")[0].n,
    )
    .toBeGreaterThan(0);
});

test("360 px: no horizontal scroll and tap targets of at least 44 px", async ({ page }) => {
  await openEditor(page);
  for (let i = 1; i <= 6; i++) await addPin(page, `Um nome longo ${i}`, `/a${i}`);
  await addPanel(page, { feature: "Tarefas", type: "Tarefas abertas", size: "Grande" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Pequeno", name: "Um contador com nome bem comprido" });
  await addPanel(page, { feature: "Geral", type: "Nota", size: "Grande", name: "Nota", text: "x".repeat(600) });
  execSql("INSERT INTO tasks (title, created_at) VALUES ('Uma tarefa com um título bem comprido para testar', 1)");
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);

  await page.getByRole("button", { name: "Adicionar painel", exact: true }).click();
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page, "dialog[open]");
  await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click();

  await page.goto("/");
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
  await page.getByRole("button", { name: "Ajustes" }).click();
  await page.getByRole("button", { name: /Exportar dados/ }).click();
  await expectTapTargets(page, "dialog[open]");
});
