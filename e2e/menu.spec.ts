import { expect, test, type Page } from "@playwright/test";
import { addBlock, blockLabels, clearDb, startEditing } from "./helpers";

// Browser checks for spec 001 "Done when". Viewport is 360 x 740 (playwright.config.ts).

test.beforeEach(async ({ page }) => {
  clearDb();
  await page.goto("/");
});

async function openEditor(page: Page, label: string) {
  await page.getByRole("button", { name: `Editar ${label}`, exact: true }).click();
  return page.getByRole("dialog");
}

test("empty database shows the pt-BR empty state with an Editar button", async ({ page }) => {
  await expect(page.getByText("Seu menu está vazio.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar", exact: true })).toBeVisible();
});

test("adds one block of each editable type and shows them in normal mode", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Atalho", label: "Tarefas", href: "/tarefas" });
  await addBlock(page, { type: "Nota", label: "Lembrete", text: "Pagar a luz" });
  await addBlock(page, { type: "Contador", label: "Água", value: "2" });
  await page.getByRole("button", { name: "Concluir" }).click();

  expect(await blockLabels(page)).toEqual(["Tarefas", "Lembrete", "Água"]);
  await expect(page.getByRole("link", { name: /Tarefas/ })).toHaveAttribute("href", "/tarefas");
  await expect(page.getByText("Pagar a luz")).toBeVisible();
  await expect(page.locator("output")).toHaveText("2");
});

test("counter + and - work outside edit mode and survive a reload", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Contador", label: "Água" });
  await page.getByRole("button", { name: "Concluir" }).click();

  const output = page.locator("output");
  await page.getByRole("button", { name: "Aumentar Água" }).click();
  await page.getByRole("button", { name: "Aumentar Água" }).click();
  await page.getByRole("button", { name: "Diminuir Água" }).click();
  await expect(output).toHaveText("1");
  // Give the last action time to reach the server before reloading.
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.locator("output")).toHaveText("1");
});

test("reordering moves one position and survives a reload", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Nota", label: "A" });
  await addBlock(page, { type: "Nota", label: "B" });
  await addBlock(page, { type: "Nota", label: "C" });

  const dialog = await openEditor(page, "C");
  await expect(dialog.getByRole("button", { name: "Mover para frente →" })).toBeDisabled();
  await dialog.getByRole("button", { name: "← Mover para trás" }).click();
  await expect.poll(() => blockLabels(page)).toEqual(["A", "C", "B"]);
  await dialog.getByRole("button", { name: "← Mover para trás" }).click();
  await expect.poll(() => blockLabels(page)).toEqual(["C", "A", "B"]);
  await expect(dialog.getByRole("button", { name: "← Mover para trás" })).toBeDisabled();

  await page.reload();
  expect(await blockLabels(page)).toEqual(["C", "A", "B"]);
});

test("rename, icon and size persist after a reload", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Nota", label: "Velho" });

  const dialog = await openEditor(page, "Velho");
  await dialog.getByLabel("Nome").fill("Novo");
  await dialog.getByRole("radio", { name: "⭐" }).click();
  await dialog.getByRole("radio", { name: "Grande" }).click();
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(dialog).toBeHidden();

  await page.reload();
  const item = page.locator('[data-block-label="Novo"]');
  await expect(item).toHaveClass(/col-span-2 row-span-2/);
  await expect(item).toContainText("⭐");
});

test("removing asks for confirmation and removes only that block", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Nota", label: "Fica" });
  await addBlock(page, { type: "Nota", label: "Sai" });

  let dialog = await openEditor(page, "Sai");
  await dialog.getByRole("button", { name: "Remover bloco" }).click();
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await dialog.getByRole("button", { name: "Fechar" }).click();
  expect(await blockLabels(page)).toEqual(["Fica", "Sai"]);

  dialog = await openEditor(page, "Sai");
  await dialog.getByRole("button", { name: "Remover bloco" }).click();
  await dialog.getByRole("button", { name: "Remover", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  expect(await blockLabels(page)).toEqual(["Fica"]);
});

test("invalid shortcut href is rejected with a pt-BR message", async ({ page }) => {
  await startEditing(page);
  await page.getByRole("button", { name: "Adicionar bloco" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome").fill("Ruim");
  for (const href of ["", "tarefas", "//evil.com", "javascript:alert(1)"]) {
    await dialog.getByLabel("Endereço").fill(href);
    await dialog.getByRole("button", { name: "Adicionar", exact: true }).click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Use um caminho que comece com / ou um endereço http:// ou https://.",
    );
  }
  await dialog.getByRole("button", { name: "Fechar" }).click();
  expect(await blockLabels(page)).toEqual([]);
});

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

// Every visible button and link inside main must be at least 44 x 44 px.
async function expectTapTargets(page: Page) {
  const small = await page.locator("main button:visible, main a:visible, main select:visible, main input:visible").evaluateAll(
    (els) =>
      els
        .map((e) => ({ name: e.getAttribute("aria-label") ?? e.textContent?.trim() ?? e.tagName, r: e.getBoundingClientRect() }))
        .filter(({ r }) => r.height < 44 || r.width < 44)
        .map(({ name, r }) => `${name}: ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small).toEqual([]);
}

test("360 px: no horizontal scroll and tap targets of at least 44 px", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Atalho", label: "Um nome bem comprido para testar quebra", href: "/x" });
  await addBlock(page, { type: "Contador", label: "Água" });
  await addBlock(page, { type: "Nota", label: "Nota", text: "x".repeat(500) });

  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);

  await openEditor(page, "Água");
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
  await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).click();

  await page.getByRole("button", { name: "Concluir" }).click();
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
});

test("CSV export downloads the blocks", async ({ page, request }) => {
  await startEditing(page);
  await addBlock(page, { type: "Nota", label: "Exportada" });
  const res = await request.get("/api/export/menu_blocks?format=csv");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-disposition"]).toContain("menu_blocks.csv");
  const body = await res.text();
  expect(body.split("\n")[0]).toContain("id;type;label;icon;size;position;config;createdAt");
  expect(body).toContain("Exportada");
});
