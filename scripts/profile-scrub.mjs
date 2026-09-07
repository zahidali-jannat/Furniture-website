/**
 * Measures what the scroll-driven video actually does under a fast scroll:
 * how many seeks are requested, how many complete, how long each takes, and
 * how many rAF frames blow past the 16.7ms budget.
 */
import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--hide-scrollbars"],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });

// Patch the currentTime setter before any page script runs.
await pg.evaluateOnNewDocument(() => {
  window.__probe = { writes: 0, seeked: 0, latencies: [], longFrames: 0, frames: 0 };
  const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime");
  Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
    get: d.get,
    set(v) {
      window.__probe.writes++;
      this.__seekStart = performance.now();
      if (!this.__wired) {
        this.__wired = true;
        this.addEventListener("seeked", () => {
          window.__probe.seeked++;
          if (this.__seekStart) window.__probe.latencies.push(performance.now() - this.__seekStart);
        });
      }
      return d.set.call(this, v);
    },
    configurable: true,
  });
  let last = performance.now();
  (function tick() {
    requestAnimationFrame(tick);
    const now = performance.now();
    window.__probe.frames++;
    if (now - last > 33) window.__probe.longFrames++;
    last = now;
  })();
});

await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 4000));

// Land in the Workspace section, which scrubs shot 05.
await pg.evaluate(() => {
  const y = document.querySelector("#workspace").getBoundingClientRect().top + scrollY - 200;
  window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
});
await new Promise((r) => setTimeout(r, 2500));
await pg.evaluate(() => Object.assign(window.__probe, { writes: 0, seeked: 0, latencies: [], longFrames: 0, frames: 0 }));

// Fast trackpad-like scroll: many small deltas in quick succession.
for (let i = 0; i < 60; i++) {
  await pg.mouse.wheel({ deltaY: 90 });
  await new Promise((r) => setTimeout(r, 16));
}
await new Promise((r) => setTimeout(r, 1500));

const extra = await pg.evaluate(() => {
  const v = document.querySelector("#workspace video");
  return { frameCount: Math.round((v?.duration ?? 0) * 60), duration: Math.round((v?.duration ?? 0) * 100) / 100 };
});

const p = await pg.evaluate(() => {
  const l = window.__probe.latencies;
  const avg = l.length ? l.reduce((a, c) => a + c, 0) / l.length : 0;
  const sorted = [...l].sort((a, c) => a - c);
  return {
    seeksRequested: window.__probe.writes,
    seeksCompleted: window.__probe.seeked,
    avgSeekMs: Math.round(avg * 10) / 10,
    p95SeekMs: Math.round((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 10) / 10,
    rafFrames: window.__probe.frames,
    framesOver33ms: window.__probe.longFrames,
  };
});
console.log(JSON.stringify({ ...extra, ...p }, null, 1));
console.log(`\n  seeks abandoned before completing: ${p.seeksRequested - p.seeksCompleted}`);
console.log(`  long-frame rate: ${((p.framesOver33ms / p.rafFrames) * 100).toFixed(1)}%`);
await b.close();
