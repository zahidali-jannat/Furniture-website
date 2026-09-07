/**
 * Proves the mail credentials work, without going through the site.
 *
 *   npm run mail:check -- you@example.com
 *
 * Verifies the SMTP connection, then sends a short test message. Once this
 * passes, the enquiry form will deliver the real branded email.
 */
import { createTransport } from "nodemailer";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Load .env.local the way Next does, so this tests the same configuration.
for (const f of [".env.local", ".env"]) {
  const p = path.resolve(f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      let v = m[2].replace(/^["']|["']$/g, "");
      // App Passwords are shown grouped in fours; the spaces are display only.
      if (m[1] === "SMTP_PASS") v = v.replace(/\s+/g, "");
      process.env[m[1]] = v;
    }
  }
}

const done = (ok, msg, hint) => {
  console.log(`\n  ${ok ? "✓" : "✗"} ${msg}`);
  if (hint) console.log(`    ${hint}`);
  console.log("");
  process.exit(ok ? 0 : 1);
};

const to = process.argv[2];
if (!to) done(false, "No recipient.", "npm run mail:check -- you@example.com");

const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((k) => !process.env[k]);
if (missing.length)
  done(false, `${missing.join(", ")} not set in .env.local`, "See .env.local for the two-step Gmail setup.");

const port = Number(process.env.SMTP_PORT ?? 587);
const from = process.env.MAIL_FROM || process.env.SMTP_USER;

console.log(`\n  host  ${process.env.SMTP_HOST}:${port}`);
console.log(`  user  ${process.env.SMTP_USER}`);
console.log(`  from  ${from}`);

const transport = createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Turns SMTP response codes into something worth reading.
 *
 * Order matters: nodemailer prefixes every AUTH failure with "Invalid login",
 * including ones that have nothing to do with the password, so the numeric
 * response code has to be consulted before any message matching.
 */
function explain(e) {
  const code = e.responseCode;
  const raw = e.response ?? e.message ?? "";
  const host = process.env.SMTP_HOST ?? "";

  if (code === 525 || /unauthorized ip/i.test(raw))
    return [
      "The credentials are fine — the provider is blocking this machine's IP.",
      "    Brevo: authorise it at https://app.brevo.com/security/authorised_ips",
      "    using 'Add current IP', then run this again.",
    ].join("\n");

  if (code === 535 || /invalid login|not accepted/i.test(raw)) {
    if (host.includes("brevo"))
      return "Brevo rejected the credentials. SMTP_PASS must be the SMTP key (starts xsmtpsib-), not the Login.";
    if (host.includes("gmail"))
      return "Gmail rejected the credentials. SMTP_PASS must be a 16-character App Password, not your account password.";
    return "The server rejected SMTP_USER / SMTP_PASS.";
  }

  if (code === 530) return "The server wanted authentication it did not get.";
  if (code === 550 || code === 553)
    return `The From address was refused. Verify it as a sender with your provider.`;
  if (e.code === "ETIMEDOUT" || e.code === "ESOCKET")
    return `Could not reach ${host}:${port} — a firewall or the wrong port.`;
  return raw || "Unknown SMTP error.";
}

try {
  await transport.verify();
  console.log("  ✓ connection and credentials accepted");
} catch (e) {
  done(false, "SMTP rejected the connection.", explain(e));
}

try {
  const started = Date.now();
  const info = await transport.sendMail({
    from,
    to,
    subject: "Maison Noir — mail check",
    text: "Mail is configured correctly. The enquiry form will now deliver the real confirmation email.",
    html: '<p style="font-family:Georgia,serif;font-size:16px">Mail is configured correctly.<br>The enquiry form will now deliver the real confirmation email.</p>',
  });
  console.log(`  ✓ accepted for delivery in ${Date.now() - started}ms`);
  console.log(`    to ${info.accepted.join(", ") || to}`);
  done(true, "Working. Restart the dev server, then submit the form.", "First message may land in spam — mark it Not spam.");
} catch (e) {
  done(false, "The server accepted the connection but refused the message.", explain(e));
}
