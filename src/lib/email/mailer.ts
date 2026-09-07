import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP rather than a vendor SDK, so this points at Resend, Postmark, SendGrid,
 * Mailgun, Fastmail or a plain company mailbox without a code change.
 *
 * With no SMTP_HOST configured the transport falls back to a local one that
 * writes each message to .mail/ instead of sending. That keeps the whole flow
 * exercisable — and reviewable — before any credentials exist.
 */

export type SendResult =
  | { delivered: true; messageId: string }
  | { delivered: false; reason: string; savedTo: string };

let cached: Transporter | null = null;

/** Explains why mail cannot be sent, or null when the config is usable. */
export function configProblem(): string | null {
  if (!process.env.SMTP_HOST) return "SMTP_HOST is not set";
  if (!process.env.SMTP_USER) return "SMTP_USER is not set";
  if (!process.env.SMTP_PASS) return "SMTP_PASS is not set";
  return null;
}

function transport(): Transporter | null {
  if (cached) return cached;
  if (configProblem()) return null;

  const host = process.env.SMTP_HOST as string;

  cached = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    // Google displays App Passwords grouped in fours ("abcd efgh ijkl mnop").
    // Pasted verbatim those spaces are sent literally and auth fails with 535.
    // No SMTP password legitimately contains whitespace, so strip it.
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.replace(/\s+/g, ""),
    },
  });

  return cached;
}

export function mailFrom() {
  // Most providers — Gmail included — require the From address to match the
  // authenticated account, so that is the sensible default.
  return process.env.MAIL_FROM || process.env.SMTP_USER || "noreply@localhost";
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const t = transport();

  if (!t) {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".mail");
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${opts.to.replace(/[^a-z0-9]/gi, "_")}.html`);
    await writeFile(file, opts.html, "utf8");
    const reason = configProblem() ?? "not configured";
    console.warn(`[mail] ${reason} — not sending. Wrote the rendered message to ${file}`);
    return { delivered: false, reason, savedTo: file };
  }

  const info = await t.sendMail({
    from: mailFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo ?? process.env.MAIL_REPLY_TO ?? undefined,
  });

  return { delivered: true, messageId: info.messageId };
}
