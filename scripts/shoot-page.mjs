/** Screenshots any path at given scroll offsets. */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
const [rawRoute = "", ...offsets] = process.argv.slice(2);
// Git Bash rewrites a leading "/" argument into a Windows path, so accept the
// route with or without one and normalise here.
const route = "/" + rawRoute.replace(/^.*?[\/]?([a-z0-9-]*(?:\/[a-z0-9-]+)*)$/i, "$1").replace(/^\/+/, "");
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto("http://localhost:3000" + route, { waitUntil: "networkidle2", timeout: 90000 });
await pg.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 3500));
await mkdir(".shots", { recursive: true });
const name = route.replace(/\W+/g, "_") || "home";
for (const y of offsets.length ? offsets.map(Number) : [0]) {
  await pg.evaluate((t) => (window.__lenis ? window.__lenis.scrollTo(t, { immediate: true }) : scrollTo(0, t)), y);
  await pg.mouse.wheel({ deltaY: 1 });
  await new Promise((r) => setTimeout(r, 2200));
  const f = `.shots/${name}-${y}.png`;
  await pg.screenshot({ path: f });
  console.log(f);
}
await b.close();
