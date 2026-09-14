import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { passwordChanged } from "@/lib/email/auth-emails";
import { appOrigin } from "@/lib/auth/config";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions, startSession, verifiedUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Changes the password from inside the account.
 *
 * The current one is required — a session left open on a borrowed laptop
 * should not be enough to lock its owner out of their own account. The
 * exception is an account created with Google, which has never had a password:
 * there is nothing to ask for, and setting one adds a second way in rather
 * than replacing the first.
 *
 * Afterwards every session is revoked and this device alone is signed back in,
 * so anyone else holding a stolen cookie is put out.
 */
export async function POST(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in again.", { code: "anonymous" }));

  const limited = guardSubject(`password:change:${user.id}`, 5, 15 * 60 * 1000);
  if (limited) return noStore(limited);

  const body = await readJson(req);
  if (!body) return noStore(fail(400, "Malformed request."));

  // A Google-only account is setting its first password, so there is no
  // current one to ask for; the schema's field is satisfied with a placeholder
  // that is never compared against anything. Everyone else must supply it.
  const parsed = changePasswordSchema.safeParse(
    user.passwordHash ? body : { currentPassword: "—", ...(body as object) }
  );

  if (!parsed.success) return noStore(invalid(parsed.error));

  const { currentPassword, password } = parsed.data;

  try {
    if (user.passwordHash && !(await verifyPassword(currentPassword, user.passwordHash))) {
      return noStore(
        fail(422, "Please check the form.", {
          fields: { currentPassword: "That is not your current password." },
        })
      );
    }

    const weak = passwordProblem(password, [user.fullName, user.email.split("@")[0]]);
    if (weak) return noStore(fail(422, "Please check the form.", { fields: { password: weak } }));

    if (user.passwordHash && (await verifyPassword(password, user.passwordHash))) {
      return noStore(
        fail(422, "Please check the form.", {
          fields: { password: "That is the password you already have." },
        })
      );
    }

    const fresh = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        failedLoginCount: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        avatarUrl: true,
        status: true,
        passwordHash: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    await revokeAllSessions(user.id, "password changed");
    await startSession(fresh, req);

    const mail = passwordChanged({
      name: user.fullName,
      when: new Date(),
      resetLink: `${appOrigin()}/forgot-password`,
    });

    sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text })
      .catch((err) => console.error("[auth] password-changed notice failed", err));

    return noStore(ok({ signedOutOtherDevices: true }));
  } catch (err) {
    return noStore(serverError("password/change", err));
  }
}
