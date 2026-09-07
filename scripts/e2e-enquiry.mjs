/** Drives the real form and reports whichever state it lands in. */
import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "shell",
  args: ["--hide-scrollbars"],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
const errs = [];
pg.on("pageerror", (e) => errs.push(e.message.slice(0, 140)));
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 3200));

await pg.evaluate(() => {
  const y = document.querySelector("#contact").getBoundingClientRect().top + scrollY + 400;
  window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y);
});
await new Promise((r) => setTimeout(r, 2500));

await pg.type("#email", process.argv[2] ?? "guest@example.com");
await pg.click('button[type="submit"]');
await new Promise((r) => setTimeout(r, 4000));

const outcome = await pg.evaluate(() => {
  const s = document.querySelector("#contact").innerText;
  return {
    claimsSuccess: s.includes("Check your inbox"),
    text: s.split("\n").filter(Boolean).slice(-4).join(" | "),
  };
});
await pg.screenshot({ path: ".shots/form-state.png" });
console.log("claims success:", outcome.claimsSuccess);
console.log("shown:", outcome.text);
console.log("page errors:", errs.length ? errs : "none");
await b.close();
