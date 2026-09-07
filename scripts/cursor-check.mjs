/** Measures the cursor dot at rest and over a nav link. */
import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 3500));

const size = () => pg.evaluate(() => {
  const dot = document.querySelector('[data-visible] span');
  const r = dot.getBoundingClientRect();
  return Math.round(r.width * 10) / 10;
});

// Rest
await pg.mouse.move(700, 500);
await new Promise((r) => setTimeout(r, 900));
console.log("at rest:      ", await size(), "px");

// Over a nav link
const link = await pg.$('header nav a');
const box = await link.boundingBox();
await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await new Promise((r) => setTimeout(r, 900));
console.log("over a label: ", await size(), "px");
await b.close();
