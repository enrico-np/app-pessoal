import { expect, test, type Page } from "@playwright/test";
import {
  activityRows,
  addActivity,
  addPanel,
  addPin,
  clearDb,
  count,
  editStatus,
  execSql,
  expectNoHorizontalScroll,
  expectTapTargets,
  finishEditing,
  keyboardMove,
  openEditor,
  panelTitles,
  pinLabels,
} from "./helpers";

// Browser checks for spec 002 and spec 003 "Done when" (Início, edit mode, panels). Viewport is 360 x 740.

test.beforeEach(() => {
  clearDb();
});

const homeHistory = (page: Page) => activityRows(page, "section[aria-labelledby=historico]");

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
  await expect(page.getByText("Fixe até 8 atalhos")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Seu início está vazio" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Adicionar primeiro painel" })).toBeVisible();
  await expect(page.getByText("Nada por aqui ainda.", { exact: false })).toBeVisible();
});

test("buttons react to hover and press; reduced motion keeps them still", async ({ browser, baseURL }) => {
  // The project emulates touch, where Chrome reports (hover: none) and hover styles do not apply (as on a
  // phone). Hover is checked in a mouse-only context.
  const context = await browser.newContext({ baseURL, viewport: { width: 360, height: 740 }, hasTouch: false });
  const page = await context.newPage();
  await page.goto("/");
  expect(await page.evaluate(() => matchMedia("(hover: hover)").matches)).toBe(true);
  const gear = page.getByRole("button", { name: "Ajustes" });
  const translate = () => gear.evaluate((el) => getComputedStyle(el).translate);
  // Tailwind composes shadows, so "no shadow" is a list of transparent 0px shadows rather than "none".
  const hasShadow = () => gear.evaluate((el) => /[1-9]px/.test(getComputedStyle(el).boxShadow));
  expect(await translate()).toBe("none");
  expect(await hasShadow()).toBe(true);
  await gear.hover();
  await expect.poll(translate).not.toBe("none");
  await expect.poll(hasShadow).toBe(false);

  await page.mouse.move(0, 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gear.hover();
  await expect.poll(hasShadow).toBe(false);
  expect(await translate()).toBe("none");

  // A flat element (the empty Fixados link) scales while pressed.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const link = page.getByRole("link", { name: /Fixe até 8 atalhos/ });
  const box = (await link.boundingBox())!;
  await page.mouse.move(box.x + 10, box.y + 10);
  await page.mouse.down();
  await expect.poll(() => link.evaluate((el) => getComputedStyle(el).scale)).toBe("0.96");
  await page.mouse.up();
  await context.close();
});

test("the pin dialog offers app pages and Link; a bad link is rejected; at most 8 pins", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const options = await dialog.getByLabel("Destino").locator("option").allTextContents();
  expect(options).toEqual(["Início", "Histórico", "Link"]);
  await dialog.getByLabel("Destino").selectOption({ label: "Histórico" });
  await expect(dialog.getByLabel("Nome")).toHaveValue("Histórico");
  await dialog.getByLabel("Destino").selectOption({ label: "Link" });
  await dialog.getByRole("textbox", { name: "Link" }).fill("youtube.com");
  await dialog.getByRole("button", { name: "Fixar" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Cole um endereço que comece com http:// ou https://.");
  await dialog.getByRole("button", { name: "Fechar" }).click();

  for (let i = 1; i <= 8; i++) await addPin(page, `Atalho ${i}`, `https://example.com/${i}`);
  await expect(page.getByRole("heading", { name: /Fixados · 8 de 8/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar", exact: true })).toHaveCount(0);

  await finishEditing(page);
  const row = page.locator("section[aria-labelledby=fixados] ul");
  const { scrollWidth, clientWidth } = await row.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
  expect(scrollWidth).toBeGreaterThan(clientWidth);
  await expectNoHorizontalScroll(page);
});

test("nothing is written before Concluir; Concluir writes one Histórico row that expands", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "Hist", "Histórico");
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Água" });
  await page.getByRole("button", { name: "Mostrar mais itens" }).click();
  expect(count("SELECT COUNT(*) AS n FROM home_pins")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM home_panels")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM activity_log")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM app_settings")).toBe(0);

  await finishEditing(page);
  expect(count("SELECT COUNT(*) AS n FROM home_pins")).toBe(1);
  expect(count("SELECT COUNT(*) AS n FROM activity_log WHERE kind = 'change'")).toBe(1);
  await expect(homeHistory(page)).toHaveCount(1);
  await expect(homeHistory(page).first()).toContainText("Início editado · 3 mudanças");

  await page.goto("/historico");
  const row = activityRows(page, "main");
  await expect(row).toHaveCount(1);
  await expect(row.getByText("Painel “Água” adicionado")).toBeHidden();
  await row.getByText("Início editado · 3 mudanças").click();
  await expect(row.locator("ol > li")).toHaveText(["Atalho “Hist” fixado", "Painel “Água” adicionado", "Itens do histórico no início: 4"]);
  await row.getByText("Início editado · 3 mudanças").click();
  await expect(row.getByText("Painel “Água” adicionado")).toBeHidden();
});

test("Voltar with changes asks first; Continuar keeps them, Descartar leaves Início as it was", async ({ page }) => {
  await openEditor(page);
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/$/); // no changes: no dialog

  await openEditor(page);
  await addPin(page, "Hist", "Histórico");
  await page.getByRole("button", { name: "Voltar" }).click();
  const dialog = page.getByRole("dialog", { name: "Descartar alterações?" });
  await expect(dialog).toContainText("Se voltar agora, as mudanças desta edição serão perdidas.");
  await dialog.getByRole("button", { name: "Continuar editando" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("[data-pin='Hist']")).toBeVisible();

  await page.getByRole("button", { name: "Voltar" }).click();
  await dialog.getByRole("button", { name: "Descartar e voltar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("Fixe até 8 atalhos")).toBeVisible();
  expect(count("SELECT COUNT(*) AS n FROM home_pins")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM activity_log WHERE kind = 'change'")).toBe(0);

  // Concluir without changes writes nothing either.
  await openEditor(page);
  await finishEditing(page);
  expect(count("SELECT COUNT(*) AS n FROM activity_log WHERE kind = 'change'")).toBe(0);
});

test("Desfazer and Refazer change only the screen; the stack is empty in a new session", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "Hist", "Histórico");
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Água" });
  await addPanel(page, { feature: "Geral", type: "Nota", size: "Médio", name: "Nota 1" });

  await page.getByRole("button", { name: "Remover Água" }).click();
  await expect(page.locator("[data-edit-panel]")).toHaveCount(1);
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.locator("[data-edit-panel='Água']")).toBeVisible();
  await expect(editStatus(page)).toHaveText("Desfeito: Painel “Água” removido.");
  await page.getByRole("button", { name: "Refazer" }).click();
  await expect(page.locator("[data-edit-panel='Água']")).toHaveCount(0);

  await page.getByRole("button", { name: "Editar Nota 1" }).click();
  await page.getByRole("dialog").getByRole("radio", { name: "Grande" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Nota · grande")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(page.getByText("Nota · médio")).toBeVisible();
  expect(count("SELECT COUNT(*) AS n FROM home_panels")).toBe(0);
  expect(count("SELECT COUNT(*) AS n FROM activity_log")).toBe(0);

  await finishEditing(page);
  expect(await panelTitles(page)).toEqual(["Nota 1"]);
  await openEditor(page);
  await expect(page.getByRole("button", { name: "Desfazer" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Refazer" })).toBeDisabled();
});

test("pins, panels and groups reorder by keyboard drag; no arrow buttons remain; order survives a reload", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "P1", "https://example.com/1");
  await addPin(page, "P2", "https://example.com/2");
  await addPin(page, "P3", "https://example.com/3");
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "A" });
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "B" });
  await addPanel(page, { feature: "Tarefas", type: "Tarefas abertas", size: "Médio" });
  await expect(page.getByRole("button", { name: /Mover .* para (cima|baixo)/ })).toHaveCount(0);

  await keyboardMove(page, "Trocar P3", "ArrowLeft", 2);
  await expect.poll(() => pinLabels(page, "edit")).toEqual(["P3", "P1", "P2"]);
  await expect(page.getByRole("dialog")).toHaveCount(0); // Space on the pin did not open its dialog
  await keyboardMove(page, "Mover B", "ArrowUp");
  await expect(editStatus(page)).toHaveText("Última mudança: Painel “B” movido.");
  await keyboardMove(page, "Mover grupo Tarefas", "ArrowUp");
  await expect(editStatus(page)).toHaveText("Última mudança: Grupo “Tarefas” movido.");

  await finishEditing(page);
  await page.reload();
  expect(await panelTitles(page)).toEqual(["Tarefas abertas", "B", "A"]);
  expect(await pinLabels(page, "home")).toEqual(["P3", "P1", "P2"]);
});

test("pins reorder by mouse drag and by touch drag", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "P1", "https://example.com/1");
  await addPin(page, "P2", "https://example.com/2");
  await addPin(page, "P3", "https://example.com/3");

  // Mouse: drag P1 onto P3. Points are 50 px below the tile top: the remove badge's 44 px tap area
  // covers the upper right of the tile.
  const tile = (label: string) => page.locator(`[data-pin='${label}'] > button`).first();
  const from = (await tile("P1").boundingBox())!;
  const to = (await tile("P3").boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + 50);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + 50, { steps: 3 });
  // Same as keyboardMove: dnd-kit listens for mouse moves only after React re-renders the lifted pin.
  await expect(tile("P1")).toHaveAttribute("aria-pressed", "true");
  await page.mouse.move(to.x + to.width / 2 + 5, to.y + 50, { steps: 10 });
  await page.waitForTimeout(250);
  await page.mouse.up();
  await expect.poll(() => pinLabels(page, "edit")).toEqual(["P2", "P3", "P1"]);
  await expect(page.getByRole("dialog")).toHaveCount(0); // the click that ends a drag does not open the pin

  // Touch: hold P1 (now last) for 300 ms, then drag it onto P2 (now first), with Chrome DevTools Protocol
  // touch events. Expected order afterwards: P1, P2, P3.
  const cdp = await page.context().newCDPSession(page);
  const a = (await tile("P1").boundingBox())!;
  const b = (await tile("P2").boundingBox())!;
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const y = a.y + 50;
  await touch("touchStart", a.x + a.width / 2, y);
  await page.waitForTimeout(300);
  await touch("touchMove", a.x + a.width / 2 + 2, y);
  await expect(tile("P1")).toHaveAttribute("aria-pressed", "true");
  for (let i = 1; i <= 10; i++) await touch("touchMove", a.x + a.width / 2 + ((b.x - a.x) * i) / 10, y);
  await page.waitForTimeout(250);
  await touch("touchEnd", 0, 0);
  await expect.poll(() => pinLabels(page, "edit")).toEqual(["P1", "P2", "P3"]);
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
  await finishEditing(page);

  await expect(page.locator("[data-group]")).toHaveCount(2);
  await expect(page.locator("[data-group=tasks] h3")).toHaveText("Tarefas");
  await expect(page.locator("[data-group=general] h3")).toHaveText("Geral");
  const sizes = await page
    .locator("[data-panel-title]")
    .evaluateAll((els) => els.map((e) => `${e.getAttribute("data-panel-title")}:${e.getAttribute("data-panel-size")}`));
  expect(sizes).toEqual(["Tarefas abertas:lg", "Água:sm", "Café:md", "Passos:lg", "Lembrete:md", "Ideias:lg"]);
  await page.getByRole("checkbox", { name: "Pagar luz" }).check();
  await expect(page.getByRole("checkbox", { name: "Pagar luz" })).toHaveCount(0);
  await expect(page.locator("[data-panel-title='Tarefas abertas']").getByText("1", { exact: true })).toBeVisible();
  await expect(page.locator("[data-panel-title='Água']")).toContainText("0/8");
  await expect(page.locator("[data-panel-title='Passos']").getByRole("img", { name: "0 de 3" })).toBeVisible();

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

test("counter + and - work on Início, survive a reload and appear in Histórico", async ({ page }) => {
  await openEditor(page);
  await addPanel(page, { feature: "Geral", type: "Contador", size: "Médio", name: "Água" });
  await finishEditing(page);
  const panel = page.locator("[data-panel-title='Água']");
  await panel.getByRole("button", { name: "Aumentar Água" }).click();
  await panel.getByRole("button", { name: "Aumentar Água" }).click();
  await panel.getByRole("button", { name: "Diminuir Água" }).click();
  await expect(panel.locator("output")).toHaveText("1");
  // The last tap is saved once its history entry appears; reloading earlier could cut the request.
  await expect(homeHistory(page).first()).toContainText("Água: 2 → 1");
  await page.reload();
  await expect(panel.locator("output")).toHaveText("1");
});

test("Histórico on Início shows the last N entries, N from the stepper", async ({ page }) => {
  for (const n of ["A", "B", "C", "D", "E"]) addActivity("general", `Entrada ${n}`, 1);
  await openEditor(page);
  await page.getByRole("button", { name: "Mostrar mais itens" }).click();
  await expect(page.locator("#edit-historico ~ div output")).toHaveText("4");
  await finishEditing(page);
  await expect(homeHistory(page)).toHaveCount(4);
  await expect(homeHistory(page).first()).toContainText("Início editado · 1 mudança");
});

test("Ordenar pelos mais usados counts pin taps in the last 7 days, not page visits", async ({ page }) => {
  await openEditor(page);
  await addPin(page, "Início", "Início");
  await addPin(page, "Hist", "Histórico");
  await addPin(page, "YT", "https://www.youtube.com/");
  await page.getByRole("switch", { name: /Ordenar pelos mais usados/ }).click();
  await expect(page.getByRole("switch", { name: /Ordenar pelos mais usados/ })).toHaveAttribute("aria-checked", "true");
  await finishEditing(page);
  expect(await pinLabels(page, "home")).toEqual(["Início", "Hist", "YT"]);

  const insert = (action: string, href: string, daysAgo: number) =>
    execSql(
      "INSERT INTO activity_log (kind, feature_key, action, summary, target_href, created_at) VALUES ('open', 'home', ?, ?, ?, ?)",
      [action, href, href, Date.now() - daysAgo * 24 * 60 * 60 * 1000],
    );
  for (let i = 0; i < 5; i++) insert("page.open", "/", 0); // visits do not count
  for (let i = 0; i < 4; i++) insert("pin.open", "/historico", 8); // older than 7 days
  insert("pin.open", "https://www.youtube.com/", 1);
  await page.reload();
  expect(await pinLabels(page, "home")).toEqual(["YT", "Início", "Hist"]);

  // A tap on a pin is recorded.
  await page.locator("section[aria-labelledby=fixados]").getByRole("link", { name: "Hist" }).click();
  await expect(page).toHaveURL(/\/historico$/);
  await expect.poll(() => count("SELECT COUNT(*) AS n FROM activity_log WHERE action = 'pin.open' AND target_href = '/historico'")).toBe(5);
  expect(count("SELECT COUNT(*) AS n FROM activity_log WHERE action = 'page.open'")).toBe(5); // no new visit rows
});

test("360 px: no horizontal scroll and tap targets of at least 44 px", async ({ page }) => {
  await openEditor(page);
  for (let i = 1; i <= 8; i++) await addPin(page, `Um nome longo ${i}`, `https://example.com/${i}`);
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

  await page.getByRole("button", { name: "Voltar" }).click();
  await expectTapTargets(page, "dialog[open]");
  await page.getByRole("button", { name: "Continuar editando" }).click();

  await finishEditing(page);
  await expectNoHorizontalScroll(page);
  await expectTapTargets(page);
  await page.getByRole("button", { name: "Ajustes" }).click();
  await page.getByRole("button", { name: /Exportar dados/ }).click();
  await expectTapTargets(page, "dialog[open]");
});
