import { expect, test } from "@playwright/test";
import { addBlock, blockLabels, clearDb, execSql, startEditing } from "./helpers";

test.beforeEach(async ({ page }) => {
  clearDb();
  await page.goto("/");
});

test("'Tarefas abertas' card shows the count of open tasks and updates after inserts", async ({ page }) => {
  await startEditing(page);
  await addBlock(page, { type: "Resumo", label: "Pendências" });
  await page.getByRole("button", { name: "Concluir" }).click();

  const block = page.locator('[data-block-label="Pendências"]');
  // The number and the words are separate elements, so textContent has no space between them.
  await expect(block).toContainText(/(^|\D)0\s*tarefas abertas/);

  execSql(
    "INSERT INTO tasks (title, done, created_at) VALUES ('a', 0, 0), ('b', 0, 0), ('c', 1, 0);",
  );
  await page.reload();
  await expect(page.locator('[data-block-label="Pendências"]')).toContainText(/(^|\D)2\s*tarefas abertas/);

  execSql("UPDATE tasks SET done = 1 WHERE title = 'a';");
  await page.reload();
  await expect(page.locator('[data-block-label="Pendências"]')).toContainText(/(^|\D)1\s*tarefa aberta$/);
});

test("a card block whose key is no longer registered shows a fallback instead of breaking the page", async ({
  page,
}) => {
  execSql(
    `INSERT INTO menu_blocks (type, label, size, position, config, created_at)
     VALUES ('card', 'Antigo', 'sm', 0, '{"cardKey":"removed"}', 0);`,
  );
  await page.reload();
  expect(await blockLabels(page)).toEqual(["Antigo"]);
  await expect(page.locator('[data-block-label="Antigo"]')).toContainText("Resumo indisponível.");
});
