import { expect, test } from "@playwright/test";

// Installability prerequisites (spec 001). Installing on a real phone is not tested here.
test("page links a valid manifest and every icon it lists is served as PNG", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute("content", /^#/);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);

  const res = await request.get(href!);
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({ name: "App Pessoal", lang: "pt-BR", start_url: "/", display: "standalone" });

  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toContain("192x192");
  expect(sizes).toContain("512x512");
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  for (const icon of manifest.icons as { src: string }[]) {
    const img = await request.get(icon.src);
    expect(img.ok(), icon.src).toBe(true);
    expect(img.headers()["content-type"], icon.src).toBe("image/png");
  }
});
