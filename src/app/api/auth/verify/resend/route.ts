import { z } from "zod";
import { prisma } from "@/lib/db";
import { LIMITS } from "@/lib/auth/config";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verificationSubject } from "@/lib/auth/pending";
import { issueEmailVerification, issuePhoneOtp } from "@/lib/auth/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ channel: z.enum(["email", "phone"]) });

/**
 * Sends another code.
 *
 * Two limits, doing different jobs: a one-minute cooldown, which stops a
 * double-click turning into two messages and the second invalidating the
 * first; and five an hour, which stops the button being used to bill us for
 * text messages or to bother whoever owns the number.
 */
export async function POST(req: Request) {
  const subject = await verificationSubject();
  if (!subject)
    return noStore(
      fail(401, "That registration has expired. Please start again.", { code: "expired" })
    );

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { channel } = parsed.data;

  const cooling = guardSubject(
    `resend:${channel}:cool:${subject.userId}`,
    1,
    LIMITS.resendCooldownSeconds * 1000
  );
  if (cooling)
    return noStore(
      fail(429, `Give it ${LIMITS.resendCooldownSeconds} seconds before asking again.`, {
        code: "cooldown",
      })
    );

  const hourly = guardSubject(`resend:${channel}:hour:${subject.userId}`, 5, 60 * 60 * 1000);
  if (hourly)
    return noStore(
      fail(429, "That is as many codes as we can send for now. Try again later.", {
        code: "rate_limited",
      })
    );

  try {
    const user = await prisma.user.findUnique({
      where: { id: subject.userId },
      select: { id: true, email: true, phone: true, fullName: true, emailVerifiedAt: true, phoneVerifiedAt: true },
    });

    if (!user) return noStore(fail(401, "That registration has expired.", { code: "expired" }));

    if (channel === "email") {
      if (user.emailVerifiedAt) return noStore(ok({ alreadyVerified: true }));

      const issued = await issueEmailVerification(user);
      return noStore(sent(issued.delivered, issued.reason, issued.devCode));
    }

    if (user.phoneVerifiedAt) return noStore(ok({ alreadyVerified: true }));
    if (!user.phone)
      return noStore(fail(422, "Add a phone number first.", { code: "no_phone" }));

    const issued = await issuePhoneOtp({ id: user.id, phone: user.phone });
    return noStore(sent(issued.delivered, issued.reason, issued.devCode));
  } catch (err) {
    return noStore(serverError("verify/resend", err));
  }
}

function sent(delivered: boolean, reason?: string, devCode?: string) {
  return ok({
    sent: delivered,
    ...(process.env.NODE_ENV !== "production" ? { dev: { reason, code: devCode } } : {}),
  });
}
