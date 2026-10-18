// Generates the placeholder app icons with Playwright's Chromium. Run: node scripts/generate-icons.mjs
// Output is committed; rerun only when the icon design changes.
import { chromium } from "@playwright/test";

const ACCENT = "#2563eb";

// `inset` is the share of the canvas kept free on each side. Maskable icons need content
// inside the central 80% safe zone, so they get more padding and a full-bleed background.
function html(size, { radius, inset }) {
  const font = Math.round(size * (1 - 2 * inset) * 0.42);
  return `<!doctype html><html><body style="margin:0">
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;
      background:${ACCENT};border-radius:${radius}px;color:#fff;
      font:700 ${font}px system-ui,Segoe UI,Arial,sans-serif;letter-spacing:-0.02em">AP</div>
  </body></html>`;
}

const outputs = [
  { file: "public/icon-192.png", size: 192, radius: 40, inset: 0.1 },
  { file: "public/icon-512.png", size: 512, radius: 104, inset: 0.1 },
  { file: "public/icon-maskable-512.png", size: 512, radius: 0, inset: 0.2 },
  { file: "src/app/apple-icon.png", size: 180, radius: 0, inset: 0.1 },
  // Browser tab icon; replaces the default favicon.ico from create-next-app.
  { file: "src/app/icon.png", size: 32, radius: 6, inset: 0.05 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, radius, inset } of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, { radius, inset }));
  await page.screenshot({ path: file, omitBackground: radius > 0 });
  console.log(`wrote ${file}`);
}
await browser.close();
