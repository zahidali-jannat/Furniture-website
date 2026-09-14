import "server-only";

/**
 * Text messages, sent the same way the email side works: a real gateway when
 * one is configured, a file on disk when one is not.
 *
 * Twilio's REST API is called with `fetch` rather than the SDK. The SDK is a
 * few megabytes of dependency to build one form-encoded POST, and this is the
 * only request the project makes to it. Another gateway is a change to
 * `deliver()` and nothing else.
 *
 * With no credentials set, a code is written to .sms/ and logged, so the whole
 * registration flow can be walked through — and reviewed — before anyone has
 * bought an SMS plan. What never happens is a message being reported as sent
 * when it was not: the caller is told plainly which of the two occurred.
 */

export type SmsResult =
  | { delivered: true; id: string }
  | { delivered: false; reason: string; savedTo: string };

export function smsConfigProblem(): string | null {
  if (!process.env.TWILIO_ACCOUNT_SID) return "TWILIO_ACCOUNT_SID is not set";
  if (!process.env.TWILIO_AUTH_TOKEN) return "TWILIO_AUTH_TOKEN is not set";
  if (!process.env.TWILIO_FROM) return "TWILIO_FROM is not set";
  return null;
}

export function smsConfigured(): boolean {
  return smsConfigProblem() === null;
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const problem = smsConfigProblem();
  if (problem) return writeLocally(to, body, problem);

  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;

  const form = new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body });

  // A messaging service takes precedence over a plain number when both are set.
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    form.delete("From");
    form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    // A gateway that has stopped answering must not hold a request open.
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // The body can quote the number and the code; it goes to the log, never to
    // the visitor.
    throw new Error(`Twilio refused the message (${res.status}): ${detail.slice(0, 400)}`);
  }

  const data = (await res.json()) as { sid?: string };
  return { delivered: true, id: data.sid ?? "sent" };
}

async function writeLocally(to: string, body: string, reason: string): Promise<SmsResult> {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const path = await import("node:path");

  const dir = path.join(process.cwd(), ".sms");
  await mkdir(dir, { recursive: true });

  const file = path.join(dir, `${Date.now()}-${to.replace(/[^0-9]/g, "")}.txt`);
  await writeFile(file, `To: ${to}\n\n${body}\n`, "utf8");

  // The code itself is printed only outside production. In production this is
  // a misconfiguration to fix, not a convenience to lean on.
  if (process.env.NODE_ENV === "production") {
    console.error(`[sms] ${reason} — nothing was sent. Wrote ${file}`);
  } else {
    console.warn(`[sms] ${reason} — not sending.\n${body}\nAlso written to ${file}`);
  }

  return { delivered: false, reason, savedTo: file };
}
