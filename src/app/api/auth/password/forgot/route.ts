import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { passwordReset } from "@/lib/email/auth-emails";
import { TTL, appOrigin } from "@/lib/auth/config";
import { guard, invalid, noStore, ok, readJson, serverError, trippedHoneypot } from "@/lib/auth/http";
import { clientIp } from "@/lib/auth/session";
import { digest, minutesFromNow, opaqueToken } from "@/lib/auth/tokens";
import { forgotPasswordSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Asks for a reset link.
 *
 * Always answers the same way. Whether or not the address is registered here
 * is not something a form should be willing to say, and "we have sent a link
 * if that address has an account" costs a real visitor nothing.
 *
 * Any live links for the account are cancelled first, so the newest email is
 * the only one that works — otherwise clicking an older message quietly sets
 * the password with a token an attacker may also have seen.
 */
export async function POST(req: Request) {
  const limited = guard(req, [
    { key: "forgot", limit: 5, windowMs: 60 * 60 * 1000 },
    { key: "forgot:burst", limit: 2, windowMs: 60 * 1000 },
  ]);
  if (limited) return noStore(limited);

  const body = await readJson(req);
  const parsed = forgotPasswordSchema.safeParse(body ?? {});
  if (!parsed.success) return noStore(invalid(parsed.error));

  if (trippedHoneypot(parsed.data.company)) return noStore(ok({ sent: true }));

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, fullName: true, email: true, status: true },
    });

    if (user && user.status !== "SUSPENDED") {
      const token = opaqueToken();

      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, consumedAt: null },
          data: { consumedAt: new Date() },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: digest(token),
            expiresAt: minutesFromNow(TTL.passwordResetMinutes),
            requestedIp: clientIp(req),
          },
        }),
      ]);

      const mail = passwordReset({
        name: user.fullName,
        link: `${appOrigin()}/reset-password?token=${token}`,
      });

      const result = await sendMail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });

      if (!result.delivered) {
        // The visitor still gets the neutral answer; this is ours to fix.
        console.error(`[auth] reset email not sent: ${result.reason}`);
      }
    }

    return noStore(ok({ sent: true }));
  } catch (err) {
    return noStore(serverError("password/forgot", err));
  }
}
