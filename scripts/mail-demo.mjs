/**
 * Sends the real confirmation email through a throwaway SMTP account that
 * Nodemailer creates on the fly — no signup, no credentials, no provider.
 *
 *   npm run mail:demo
 *
 * The message is genuinely delivered over SMTP and returns a URL where you can
 * read it. It does not reach a real inbox; use it to see the pipeline working
 * while a production provider is being sorted out.
 */
import { createTestAccount, createTransport, getTestMessageUrl } from "nodemailer";

const res = await fetch("http://localhost:3000/api/dev/email-preview").catch(() => null);
if (!res?.ok) {
  console.error("\n  ✗ Could not reach the dev server. Run `npm run dev` first.\n");
  process.exit(1);
}
const html = await res.text();

console.log("\n  creating a throwaway SMTP account…");
const account = await createTestAccount();

const transport = createTransport({
  host: account.smtp.host,
  port: account.smtp.port,
  secure: account.smtp.secure,
  auth: { user: account.user, pass: account.pass },
});

const started = Date.now();
const info = await transport.sendMail({
  from: "Maison Noir <hello@maisonnoir.test>",
  to: "guest@example.com",
  subject: "Maison Noir — your visit",
  html,
  text: "Thank you for writing. We reply within two working days.",
});

console.log(`  ✓ delivered over SMTP in ${Date.now() - started}ms`);
console.log(`\n  Read it here:\n  ${getTestMessageUrl(info)}\n`);
