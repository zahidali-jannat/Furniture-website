/**
 * Dev-only visual check. Renders the running dev server in headless Chrome and
 * writes PNGs to .shots/. The in-app preview pane suspends rAF whenever it is
 * hidden, which freezes GSAP mid-tween and yields blank captures.
 *
 *   node scripts/shoot.mjs 0 900 1800        # scroll offsets, desktop
 *   node scripts/shoot.mjs --mobile 0 900
 */
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = path.resolve(import.meta.dirname, "..", ".shots");

const args = process.argv.slice(2);
const mobile = args.includes("--mobile");
const offsets = args.filter((a) => !a.startsWith("--")).map(Number);
const width = mobile ? 390 : 1440;
const height = mobile ? 844 : 900;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "shell",
  args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--force-device-scale-factor=1"],
});

const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90_000 });
await page.evaluate(() => document.fonts.ready);

await mkdir(OUT, { recursive: true });

for (const y of offsets.length ? offsets : [0]) {
  await page.evaluate((target) => {
    const l = window.__lenis;
    if (l) l.scrollTo(target, { immediate: true });
    else window.scrollTo(0, target);
  }, y);
  // Let ScrollTrigger settle and every entrance tween finish. The preloader
  // alone runs ~2.6s before the hero timeline even starts.
  await new Promise((r) => setTimeout(r, 4800));
  const file = path.join(OUT, `${mobile ? "m" : "d"}-${y}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}

await browser.close();
