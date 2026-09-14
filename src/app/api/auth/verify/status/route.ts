import { prisma } from "@/lib/db";
import { afterVerification } from "@/lib/auth/finish";
import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { verificationSubject } from "@/lib/auth/pending";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where the registration has got to.
 *
 * The verification screen polls this, which is what makes the emailed link
 * work: open it on a phone, and the tab still sitting on the laptop notices
 * within a few seconds and moves on by itself. Without the poll the link would
 * verify an address whose owner is looking at a different device.
 *
 * It also finishes the job. If the link completed the last outstanding proof,
 * this is where the session is issued.
 */
export async function GET(req: Request) {
  const subject = await verificationSubject();
  if (!subject) return noStore(fail(401, "That registration has expired.", { code: "expired" }));

  try {
    const user = await prisma.user.findUnique({
      where: { id: subject.userId },
      select: { emailVerifiedAt: true, phoneVerifiedAt: true },
    });

    if (!user) return noStore(fail(401, "That registration has expired.", { code: "expired" }));

    const status = await afterVerification(subject, req);

    return noStore(ok({ ...status, next: status.complete ? "/account" : null }));
  } catch (err) {
    return noStore(serverError("verify/status", err));
  }
}
