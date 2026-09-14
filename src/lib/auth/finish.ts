import "server-only";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { welcome } from "@/lib/email/auth-emails";
import { appOrigin } from "./config";
import { clearPending, type Subject } from "./pending";
import { reissueAccess, startSession } from "./session";
import { activateIfProven } from "./verification";

/**
 * What happens the moment a verification succeeds.
 *
 * Shared by both channels so that whichever one finishes second does the same
 * thing: promote the account, sign the visitor in if they were registering,
 * and refresh the token's flags if they were already signed in.
 *
 * The welcome email is sent without being awaited. A mail server having a slow
 * afternoon is not a reason to hold up somebody's first sight of their account.
 */
export async function afterVerification(subject: Subject, req: Request) {
  const status = await activateIfProven(subject.userId);
  if (!status)
    return { emailVerified: false, phoneVerified: false, phoneUnavailable: false, complete: false };

  const user = await prisma.user.findUnique({
    where: { id: subject.userId },
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

  if (!user)
    return { emailVerified: false, phoneVerified: false, phoneUnavailable: false, complete: false };

  if (subject.from === "session") {
    await reissueAccess(user);
    return status;
  }

  // Registering, and every proof this server can actually ask for is in. That
  // is both of them on a configured server, and the email alone where no SMS
  // gateway exists — see activateIfProven.
  if (status.complete) {
    await startSession(user, req);
    await clearPending();

    const mail = welcome({ name: user.fullName, link: `${appOrigin()}/account` });
    sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text })
      .catch((err) => console.error("[auth] welcome email failed", err));
  }

  return status;
}
