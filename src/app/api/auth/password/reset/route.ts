import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { passwordChanged } from "@/lib/email/auth-emails";
import { appOrigin } from "@/lib/auth/config";
import { fail, guard, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { digest } from "@/lib/auth/tokens";
import { resetPasswordSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sets a new password from a reset link.
 *
 * Three things happen together and they are not negotiable: the token is spent,
 * the password is replaced, and every session on the account is revoked. The
 * last one is the point of the exercise — someone resetting a password has
 * often had it taken, and leaving the thief's session alive would make the
 * reset theatre.
 *
 * The visitor is then asked to sign in with the new password rather than being
 * signed in here, because that is the one action that proves the reset landed
 * where they meant it to.
 */
export async function POST(req: Request) {
  const limited = guard(req, [{ key: "reset", limit: 10, windowMs: 60 * 60 * 1000 }]);
  if (limited) return noStore(limited);

  const parsed = resetPasswordSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { token, password } = parsed.data;

  try {
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: digest(token) },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!row || row.consumedAt || row.expiresAt < new Date()) {
      return noStore(
        fail(410, "That link has expired or has already been used. Ask for a new one.", {
          code: "token_invalid",
        })
      );
    }

    const weak = passwordProblem(password, [row.user.fullName, row.user.email.split("@")[0]]);
    if (weak) return noStore(fail(422, "Please check the form.", { fields: { password: weak } }));

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
    ]);

    await revokeAllSessions(row.userId, "password reset");
    await clearAuthCookies();

    const mail = passwordChanged({
      name: row.user.fullName,
      when: new Date(),
      resetLink: `${appOrigin()}/forgot-password`,
    });

    sendMail({ to: row.user.email, subject: mail.subject, html: mail.html, text: mail.text })
      .catch((err) => console.error("[auth] password-changed notice failed", err));

    return noStore(ok({ next: "/login" }));
  } catch (err) {
    return noStore(serverError("password/reset", err));
  }
}
