import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "shell", args: ["--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
pg.on("console", (m) => console.log("[console]", m.type(), m.text().slice(0, 160)));
pg.on("pageerror", (e) => console.log("[pageerror]", e.message.slice(0, 200)));
pg.on("request", (r) => { if (r.url().includes("/api/")) console.log("[req]", r.method(), r.url()); });
pg.on("response", async (r) => { if (r.url().includes("/api/")) console.log("[res]", r.status(), (await r.text().catch(()=>"")).slice(0,120)); });
await pg.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 });
await new Promise((r) => setTimeout(r, 3200));
await pg.evaluate(() => { const y = document.querySelector("#contact").getBoundingClientRect().top + scrollY + 400; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
await new Promise((r) => setTimeout(r, 2500));

console.log(JSON.stringify(await pg.evaluate(() => {
  const btn = document.querySelector('button[type="submit"]');
  const input = document.querySelector("#email");
  if (!btn) return { btn: "MISSING" };
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const top = document.elementFromPoint(cx, cy);
  return {
    btnRect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    inViewport: r.top >= 0 && r.bottom <= innerHeight,
    topElementAtButtonCentre: top ? top.tagName + "." + String(top.className).slice(0, 60) : "none",
    inputRect: input ? Math.round(input.getBoundingClientRect().y) : "no input",
    formFound: !!document.querySelector("form"),
  };
}), null, 1));

// Submit directly via the DOM, bypassing any hit-testing question.
await pg.evaluate(() => {
  const i = document.querySelector("#email");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(i, "guest@example.com");
  i.dispatchEvent(new Event("input", { bubbles: true }));
  document.querySelector("form").requestSubmit();
});
await new Promise((r) => setTimeout(r, 4000));
console.log("body has success text:", await pg.evaluate(() => document.body.innerText.includes("Check your inbox")));
console.log("visible message:", await pg.evaluate(() => document.querySelector("#contact")?.innerText.slice(0, 300)));
await b.close();
