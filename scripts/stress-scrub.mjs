/** Hammers the scrub with fast flicks and direction reversals. */
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.evaluateOnNewDocument(() => {
  window.__p = { writes: 0, seeked: 0, maxQueue: 0, long: 0, frames: 0, times: new Set() };
  const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");
  Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
    get: d.get,
    set(v) {
      window.__p.writes++;
      window.__p.times.add(Math.round(v * 1000));
      if (!this.__w) { this.__w = true; this.addEventListener("seeked", () => window.__p.seeked++); }
      return d.set.call(this, v);
    }, configurable: true,
  });
  let last = performance.now();
  (function t(){ requestAnimationFrame(t); const n = performance.now(); window.__p.frames++; if (n - last > 33) window.__p.long++; last = n; })();
});
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 4000));
await pg.evaluate(() => { const y = document.querySelector("#workspace").getBoundingClientRect().top + scrollY - 200; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
await new Promise((r) => setTimeout(r, 2500));
await pg.evaluate(() => { window.__p.writes = 0; window.__p.seeked = 0; window.__p.long = 0; window.__p.frames = 0; window.__p.times.clear(); });

// Flick hard, reverse, flick again — no pacing at all.
for (let burst = 0; burst < 6; burst++) {
  const dir = burst % 2 === 0 ? 1 : -1;
  for (let i = 0; i < 25; i++) await pg.mouse.wheel({ deltaY: 300 * dir });
  await new Promise((r) => setTimeout(r, 260));
}
await new Promise((r) => setTimeout(r, 2000));

const p = await pg.evaluate(() => ({
  seeksRequested: window.__p.writes,
  seeksCompleted: window.__p.seeked,
  distinctFrames: window.__p.times.size,
  rafFrames: window.__p.frames,
  framesOver33ms: window.__p.long,
}));
console.log(JSON.stringify(p, null, 1));
console.log(`  redundant seeks: ${p.seeksRequested - p.distinctFrames}`);
console.log(`  long-frame rate: ${((p.framesOver33ms / p.rafFrames) * 100).toFixed(1)}%`);
await b.close();
