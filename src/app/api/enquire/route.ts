import { NextResponse } from "next/server";
import { sendMail, mailFrom } from "@/lib/email/mailer";
import {
  CONFIRMATION_SUBJECT,
  confirmationHtml,
  confirmationText,
} from "@/lib/email/template";
import { rateLimit, sweep } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Sends the enquiry confirmation.
 *
 * The message body is fixed brand copy — the submitted address is used only as
 * a recipient and never rendered into the email. That is what keeps this from
 * being a relay someone can use to push arbitrary text at arbitrary people.
 */

// Deliberately conservative. HTML5 validation catches typos; this catches shapes.
const EMAIL = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+(\.[^\s@.,;:<>()[\]\\]+)+$/;

const LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `enquire:${ip}`;
}

export async function POST(req: Request) {
  sweep();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const { email, company } = (body ?? {}) as { email?: unknown; company?: unknown };

  // Honeypot: a real person never fills a field they cannot see. Answer 200 so
  // a bot cannot tell it was caught.
  if (typeof company === "string" && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email.trim())) {
    return NextResponse.json(
      { error: "That address does not look right." },
      { status: 422 }
    );
  }

  const address = email.trim();

  const limited = rateLimit(clientKey(req), LIMIT, WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  try {
    const result = await sendMail({
      to: address,
      subject: CONFIRMATION_SUBJECT,
      html: confirmationHtml(),
      text: confirmationText(),
    });

    // Let the workshop know somebody asked. Never blocks the reply to the visitor.
    const inbox = process.env.MAIL_NOTIFY_TO;
    if (inbox) {
      sendMail({
        to: inbox,
        subject: `Enquiry — ${address}`,
        html: `<p>New showroom enquiry from <strong>${escapeHtml(address)}</strong>.</p>`,
        text: `New showroom enquiry from ${address}.`,
        replyTo: address,
      }).catch((e) => console.error("[mail] notification failed", e));
    }

    // Never report success for a message that was not actually handed to a
    // mail server — a confirmation screen that lies is worse than an error.
    if (!result.delivered) {
      console.error(`[mail] ${result.reason} — nothing was sent. See .env.example.`);
      return NextResponse.json(
        {
          error: "Email is not configured on this server yet.",
          ...(process.env.NODE_ENV !== "production"
            ? { note: `${result.reason}. Draft saved to ${result.savedTo}` }
            : {}),
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[mail] send failed", err, "from:", mailFrom());
    return NextResponse.json(
      {
        error: "We could not send that just now. Please try again.",
        // The visitor gets the neutral line above; the cause is for us.
        ...(process.env.NODE_ENV !== "production"
          ? { note: explainSmtp(err) }
          : {}),
      },
      { status: 502 }
    );
  }
}

/**
 * Turns an SMTP failure into something worth reading, in development.
 *
 * The numeric code is checked before any message matching: nodemailer labels
 * every AUTH failure "Invalid login", including ones that are nothing to do
 * with the password.
 */
function explainSmtp(err: unknown): string {
  const e = err as { responseCode?: number; code?: string; message?: string; response?: string };
  const raw = e?.response ?? e?.message ?? "";
  const host = process.env.SMTP_HOST ?? "";

  if (e?.responseCode === 525 || /unauthorized ip/i.test(raw))
    return "The provider is blocking this server's IP. Authorise it in the provider's dashboard.";
  if (e?.responseCode === 535 || /invalid login|not accepted/i.test(raw)) {
    if (host.includes("brevo"))
      return "Brevo rejected the credentials. SMTP_PASS must be the SMTP key (starts xsmtpsib-), not the Login.";
    if (host.includes("gmail"))
      return "Gmail rejected the credentials. SMTP_PASS must be a 16-character App Password.";
    return "The mail server rejected SMTP_USER / SMTP_PASS.";
  }
  if (e?.responseCode === 530) return "The server wanted authentication it did not get.";
  if (e?.responseCode === 550 || e?.responseCode === 553)
    return "The From address was refused; verify it as a sender with your provider.";
  if (e?.code === "ETIMEDOUT" || e?.code === "ESOCKET")
    return "Could not reach the SMTP host — check SMTP_HOST, SMTP_PORT and any firewall.";
  return raw || "Unknown SMTP error.";
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
