import puppeteer from "puppeteer-core";
const CH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

// --- reduced motion: content must be visible, not stuck in a "from" state ---
let b = await puppeteer.launch({ executablePath: CH, headless: "shell", args: ["--hide-scrollbars"] });
let pg = await b.newPage();
await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 1500));
console.log("REDUCED MOTION:", JSON.stringify(await pg.evaluate(() => {
  const preloader = document.querySelector('[aria-hidden="true"].fixed');
  const frame = document.querySelector("#statement .media-frame");
  return {
    htmlOverflow: document.documentElement.style.overflow || "(unset)",
    preloaderDisplay: preloader ? getComputedStyle(preloader).display : "absent",
    heroLine: getComputedStyle(document.querySelector(".hero-line")).transform,
    heroH1Opacity: getComputedStyle(document.querySelector("#hero h1")).opacity,
    statementClip: getComputedStyle(frame).clipPath,
    statementLine: getComputedStyle(document.querySelector("#statement .rv-line")).transform,
    hiddenFades: [...document.querySelectorAll("#statement div")]
      .map((d) => getComputedStyle(d).opacity).filter((o) => o !== "1"),
  };
}), null, 1));
await pg.screenshot({ path: ".shots/reduced-motion.png" });
await b.close();

// --- what the page actually fetches before any scroll ---
b = await puppeteer.launch({ executablePath: CH, headless: "shell", args: ["--hide-scrollbars"] });
pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
const bytes = {};
pg.on("response", (r) => {
  const t = r.request().resourceType();
  bytes[t] = (bytes[t] || 0) + Number(r.headers()["content-length"] || 0);
});
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 2500));
console.log("\nFETCHED BEFORE SCROLL (dev server, unminified):");
for (const [k, v] of Object.entries(bytes)) console.log(`  ${k}: ${(v / 1024).toFixed(0)} KB`);
console.log("videos with data at rest:", JSON.stringify(
  await pg.evaluate(() => [...document.querySelectorAll("video")]
    .map((v) => ({ src: v.currentSrc.split("/").pop() || "(not fetched)", readyState: v.readyState })))
));
await b.close();
