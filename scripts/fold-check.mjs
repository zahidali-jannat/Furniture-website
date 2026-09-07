/** Reports where the product page's key elements land relative to the fold. */
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const url = process.argv[2] ?? "http://localhost:3000/collections/chandeliers/chandeliers-01";
const sizes = [[1280, 720], [1366, 768], [1440, 900], [1600, 900], [1920, 1080], [2560, 1440], [834, 1112], [430, 932], [393, 852], [390, 844], [375, 667]];
const pg = await b.newPage();
for (const [w, h] of sizes) {
  await pg.setViewport({ width: w, height: h });
  await pg.goto(url, { waitUntil: "networkidle2" });
  await pg.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 1200));
  const m = await pg.evaluate(() => {
    // The plate is the image itself now, not a framed box around it.
    const img = document.querySelector("article img")?.getBoundingClientRect();
    const next = document.querySelector('nav[aria-label="Other pieces"]')?.getBoundingClientRect();
    const info = document.querySelector("article h1")?.closest("div")?.getBoundingClientRect();
    return {
      imgH: img ? Math.round(img.height) : 0,
      imgBottom: img ? Math.round(img.bottom) : 0,
      infoBottom: info ? Math.round(info.bottom) : 0,
      nextTop: next ? Math.round(next.top) : 0,
      nextBottom: next ? Math.round(next.bottom) : 0,
      vh: innerHeight,
    };
  });
  const fits = m.nextBottom > 0 && m.nextBottom <= m.vh;
  console.log(
    `${String(w).padStart(4)}x${String(h).padEnd(4)} image ${String(m.imgH).padStart(4)}px  ` +
    `img ends ${String(m.imgBottom).padStart(5)}  Next at ${String(m.nextTop).padStart(5)}..${String(m.nextBottom).padStart(5)}  ` +
    `viewport ${String(m.vh).padStart(4)}  ${fits ? "FITS" : `overflows by ${m.nextBottom - m.vh}px`}`
  );
}
await b.close();
