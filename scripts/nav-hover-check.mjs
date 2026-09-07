/** Samples the nav label response at several pointer distances. */
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 3800));

const read = () => pg.evaluate(() => {
  const link = [...document.querySelectorAll("header [data-magnetic]")].find((a) =>
    a.textContent.trim().toUpperCase().startsWith("LIGHTING"));
  const label = link.querySelector("[data-label]");
  const pill = link.querySelector("[data-pill]");
  const t = getComputedStyle(label).transform;
  const m = t === "none" ? [0, 0] : t.match(/matrix\(([^)]+)\)/)[1].split(",").map(Number).slice(4);
  return {
    liftPx: Math.round(m[1] * 10) / 10,
    pillOpacity: Math.round(parseFloat(getComputedStyle(pill).opacity) * 1000) / 1000,
    pillScale: Math.round(parseFloat(getComputedStyle(pill).transform.match(/matrix\(([^)]+)\)/)?.[1].split(",")[0] ?? 1) * 100) / 100,
  };
});

const target = await pg.evaluate(() => {
  const link = [...document.querySelectorAll("header [data-magnetic]")].find((a) =>
    a.textContent.trim().toUpperCase().startsWith("LIGHTING"));
  const r = link.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});

for (const [name, dx, dy] of [["far (300px away)", 300, 0], ["near (60px away)", 60, 0], ["hovering", 0, 0]]) {
  await pg.mouse.move(target.x + dx, target.y + dy);
  await new Promise((r) => setTimeout(r, 900));
  const s = await read();
  console.log(`${name.padEnd(18)} lift ${String(s.liftPx).padStart(5)}px   pill opacity ${String(s.pillOpacity).padStart(5)}   scale ${s.pillScale}`);
}
await pg.screenshot({ path: ".shots/nav-hover.png", clip: { x: 380, y: 0, width: 700, height: 70 } });
await b.close();
