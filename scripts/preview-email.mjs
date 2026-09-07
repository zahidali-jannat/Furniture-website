/** Renders the saved confirmation email to .shots/email.png for review. */
import puppeteer from "puppeteer-core";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.resolve(".mail");
const file = process.argv[2] ?? readdirSync(dir).filter((f) => f.endsWith(".html")).pop();
if (!file) throw new Error("No message in .mail/ — POST to /api/enquire first.");

const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
});
const pg = await b.newPage();
await pg.setViewport({ width: 700, height: 1200 });
await pg.goto(pathToFileURL(path.join(dir, file)).href, { waitUntil: "networkidle0" });
await pg.screenshot({ path: ".shots/email.png", fullPage: true });
console.log("rendered", file, "-> .shots/email.png");
await b.close();
