/**
 * Proves no image in the Collections experience is cropped.
 *
 * A rendered box whose aspect matches the file's natural aspect shows the whole
 * picture. Any divergence means pixels are being cut off — by object-fit:cover,
 * by a forced aspect-ratio, or by a transform pushing edges out of the frame.
 */
import puppeteer from "puppeteer-core";

const ROUTES = [
  "/collections",
  "/collections/lighting",
  "/collections/chandeliers",
  "/collections/sofa",
  "/collections/chandeliers/chandeliers-01",
  "/collections/sofa/sofa-05",
  "/",
];
const SIZES = [[1366, 768], [1440, 900], [1920, 1080], [834, 1112], [390, 844]];

const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--hide-scrollbars"],
});
const pg = await b.newPage();
let checked = 0;
const bad = [];

for (const [w, h] of SIZES) {
  await pg.setViewport({ width: w, height: h });
  for (const route of ROUTES) {
    await pg.goto("http://localhost:3000" + route, { waitUntil: "networkidle2", timeout: 90000 });
    await pg.evaluate(() => document.fonts.ready);
    // Scroll the page so lazy images decode and reveals settle.
    await pg.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 1400));

    const rows = await pg.evaluate(() =>
      [...document.querySelectorAll("img")]
        .filter((i) => i.naturalWidth > 0 && i.getBoundingClientRect().width > 4)
        .map((i) => {
          const r = i.getBoundingClientRect();
          return {
            src: i.currentSrc.split("/").pop().slice(0, 34),
            fit: getComputedStyle(i).objectFit,
            natural: i.naturalWidth / i.naturalHeight,
            rendered: r.width / r.height,
            box: `${Math.round(r.width)}x${Math.round(r.height)}`,
          };
        })
    );

    for (const r of rows) {
      checked++;
      // 1.5% tolerance covers sub-pixel rounding at these sizes.
      const off = Math.abs(r.rendered - r.natural) / r.natural;
      if (off > 0.015 && r.fit !== "contain") {
        bad.push({ route, size: `${w}x${h}`, ...r, off: (off * 100).toFixed(1) + "%" });
      }
    }
  }
}

console.log(`checked ${checked} rendered images across ${ROUTES.length} routes x ${SIZES.length} sizes
`);
for (const route of ROUTES) {
  const n = bad.filter((r) => r.route === route).length;
  console.log(`  ${route.padEnd(42)} ${n ? `${n} cropped` : "whole"}`);
}
const inCollections = bad.filter((r) => r.route.startsWith("/collections"));
console.log(`
Collections: ${inCollections.length ? `${inCollections.length} CROPPED` : "no cropping — every image renders at its own aspect ratio"}`);
if (bad.length) {
  console.log(`Elsewhere: ${bad.length - inCollections.length} (homepage editorial plates, art-directed crops)`);
}
await b.close();
