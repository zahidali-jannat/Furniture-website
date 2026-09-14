import { prisma } from "@/lib/db";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifyPassword } from "@/lib/auth/password";
import { currentUser } from "@/lib/auth/session";
import { deleteAccountSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Closes the account for good.
 *
 * Two gates: the word DELETE typed by hand, and the password where there is
 * one. A Google-only account has no password to ask for, so the typed word and
 * a live session are what it has — the same standing Google itself gives that
 * session.
 *
 * The row is deleted rather than flagged. Cascades take the sessions, tokens,
 * one-time codes, provider links and saved pieces with it; enquiries are the
 * one exception — `onDelete: SetNull` keeps the correspondence, unattached,
 * because a conversation the workshop is in the middle of belongs to both
 * sides of it and may be needed for an order already in progress.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`delete:${user.id}`, 5, 60 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = deleteAccountSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  try {
    if (user.passwordHash) {
      const supplied = parsed.data.password ?? "";
      if (!supplied || !(await verifyPassword(supplied, user.passwordHash))) {
        return noStore(
          fail(422, "Please check the form.", {
            fields: { password: "That is not your password." },
          })
        );
      }
    }

    await prisma.user.delete({ where: { id: user.id } });
    await clearAuthCookies();

    return noStore(ok({ next: "/" }));
  } catch (err) {
    return noStore(serverError("account:delete", err));
  }
}
