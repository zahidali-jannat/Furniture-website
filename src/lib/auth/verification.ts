import "server-only";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { verifyEmail as verifyEmailTemplate } from "@/lib/email/auth-emails";
import { sendSms, smsConfigured } from "@/lib/sms/sender";
import { BRAND } from "@/lib/brand";
import { LIMITS, TTL, appOrigin } from "./config";
import {
  digest,
  hashCode,
  minutesFromNow,
  numericCode,
  opaqueToken,
  spacedCode,
  verifyCode,
} from "./tokens";

/**
 * Proving an address and a number belong to the person typing them.
 *
 * The two channels work the same way and share the same rules:
 *
 *   · A code lives for minutes, not hours.
 *   · Asking for a new one kills the old one, so only the most recent works.
 *   · Wrong guesses are counted on the row. Five, and the code is spent —
 *     the sixth guess fails even if it is right, and a new code must be sent.
 *     Rate limiting alone cannot do this; it is per IP, and the attacker
 *     picks the IP.
 *   · Nothing stored can be turned back into a code.
 *
 * Every function here reports whether the message actually left the building.
 * A verification screen that says "check your phone" when no gateway is
 * configured is a dead end with no explanation, so the callers surface that.
 */

export type Issued = {
  delivered: boolean;
  /** Why it was not delivered. Shown only outside production. */
  reason?: string;
  /** The code, returned only in development, so the flow can be walked alone. */
  devCode?: string;
};

export type CheckResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "wrong" | "spent" | "none"; remaining?: number };

const devOnly = <T>(value: T): T | undefined =>
  process.env.NODE_ENV === "production" ? undefined : value;

// ------------------------------------------------------------------- email --

export async function issueEmailVerification(user: {
  id: string;
  email: string;
  fullName: string;
}): Promise<Issued> {
  const code = numericCode();
  const token = opaqueToken();

  await prisma.$transaction([
    // Only the newest code is live. An old one left usable is a second door.
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        tokenHash: digest(token),
        codeHash: await hashCode(code),
        expiresAt: minutesFromNow(TTL.emailTokenMinutes),
      },
    }),
  ]);

  const link = `${appOrigin()}/create-account/verify?token=${token}`;
  const mail = verifyEmailTemplate({ name: user.fullName, code, link });

  const result = await sendMail({
    to: user.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  });

  return result.delivered
    ? { delivered: true }
    : { delivered: false, reason: result.reason, devCode: devOnly(code) };
}

export async function checkEmailCode(userId: string, code: string): Promise<CheckResult> {
  const row = await prisma.emailVerificationToken.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return { ok: false, reason: "none" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (row.attempts >= LIMITS.otpAttempts) {
    await spendEmailToken(row.id);
    return { ok: false, reason: "spent" };
  }

  if (!(await verifyCode(code, row.codeHash))) {
    const { attempts } = await prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });

    if (attempts >= LIMITS.otpAttempts) {
      await spendEmailToken(row.id);
      return { ok: false, reason: "spent" };
    }
    return { ok: false, reason: "wrong", remaining: LIMITS.otpAttempts - attempts };
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

/** The link half of the same token. Returns the user it proved, or null. */
export async function checkEmailLink(token: string): Promise<string | null> {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: digest(token) },
  });

  if (!row || row.consumedAt || row.expiresAt < new Date()) return null;

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return row.userId;
}

function spendEmailToken(id: string) {
  return prisma.emailVerificationToken.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

// ------------------------------------------------------------------- phone --

export async function issuePhoneOtp(user: {
  id: string;
  phone: string;
}): Promise<Issued> {
  const code = numericCode();

  await prisma.$transaction([
    prisma.phoneOtp.updateMany({
      where: { userId: user.id, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    prisma.phoneOtp.create({
      data: {
        userId: user.id,
        phone: user.phone,
        codeHash: await hashCode(code),
        expiresAt: minutesFromNow(TTL.phoneOtpMinutes),
      },
    }),
  ]);

  // Short, no link, brand named first: the shape people expect from an OTP,
  // and the shape that does not look like a phishing text.
  const body = `${spacedCode(code)} is your ${BRAND.wordmark} code. It expires in ${TTL.phoneOtpMinutes} minutes. We will never ring you to ask for it.`;

  try {
    const result = await sendSms(user.phone, body);
    return result.delivered
      ? { delivered: true }
      : { delivered: false, reason: result.reason, devCode: devOnly(code) };
  } catch (err) {
    console.error("[sms] send failed", err);
    return { delivered: false, reason: "the gateway refused the message", devCode: devOnly(code) };
  }
}

export async function checkPhoneCode(userId: string, code: string): Promise<CheckResult> {
  const row = await prisma.phoneOtp.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return { ok: false, reason: "none" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (row.attempts >= LIMITS.otpAttempts) {
    await spendOtp(row.id);
    return { ok: false, reason: "spent" };
  }

  if (!(await verifyCode(code, row.codeHash))) {
    const { attempts } = await prisma.phoneOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });

    if (attempts >= LIMITS.otpAttempts) {
      await spendOtp(row.id);
      return { ok: false, reason: "spent" };
    }
    return { ok: false, reason: "wrong", remaining: LIMITS.otpAttempts - attempts };
  }

  await prisma.$transaction([
    prisma.phoneOtp.update({ where: { id: row.id }, data: { consumedAt: new Date() } }),
    // The number is taken from the row, not from the request: a code sent to
    // one number must not be able to verify another.
    prisma.user.update({
      where: { id: userId },
      data: { phone: row.phone, phoneVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

function spendOtp(id: string) {
  return prisma.phoneOtp.update({ where: { id }, data: { consumedAt: new Date() } });
}

// ------------------------------------------------------------------ status --

/**
 * Promotes a user to ACTIVE once both channels are proven.
 *
 * Called after either verification succeeds; the second one to finish is the
 * one that flips the account.
 */
export async function activateIfProven(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true, phoneVerifiedAt: true, status: true },
  });

  if (!user) return null;

  const emailVerified = Boolean(user.emailVerifiedAt);
  const phoneVerified = Boolean(user.phoneVerifiedAt);
  const proven = emailVerified && phoneVerified;

  if (proven && user.status === "PENDING") {
    await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
  }

  /**
   * A server with no SMS gateway cannot deliver a phone code — not now, not
   * after the fifth resend. Holding registration shut behind a message that
   * will never arrive strands every visitor on the verification screen, so
   * when there is no gateway the account opens on the proven email address
   * alone and the number stays on file, unconfirmed, for the dashboard to ask
   * about once a gateway exists.
   *
   * The account is still only ACTIVE with both proofs in, so nothing here
   * quietly promotes a half-checked account: what changes is whether the
   * visitor is let in, not what we claim to have verified.
   */
  const phoneUnavailable = !smsConfigured();

  return {
    emailVerified,
    phoneVerified,
    phoneUnavailable,
    complete: emailVerified && (phoneVerified || phoneUnavailable),
  };
}

/** Human-readable reason for a failed code, used by every verification route. */
export function explainCheck(result: Exclude<CheckResult, { ok: true }>): string {
  switch (result.reason) {
    case "expired":
      return "That code has expired. Ask for a new one.";
    case "spent":
      return "Too many wrong attempts. Ask for a new code.";
    case "none":
      return "There is no code waiting. Ask for a new one.";
    default:
      return result.remaining === 1
        ? "That code is not right. One attempt left."
        : "That code is not right.";
  }
}
