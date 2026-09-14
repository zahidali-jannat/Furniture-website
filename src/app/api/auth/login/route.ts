import { prisma } from "@/lib/db";
import { LIMITS } from "@/lib/auth/config";
import { fail, guard, invalid, noStore, ok, readJson, serverError, trippedHoneypot } from "@/lib/auth/http";
import { fakeVerifyDelay, verifyPassword } from "@/lib/auth/password";
import { startPending } from "@/lib/auth/pending";
import { startSession } from "@/lib/auth/session";
import { loginSchema, safeNext } from "@/lib/auth/validation";
import { issueEmailVerification, issuePhoneOtp } from "@/lib/auth/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signing in.
 *
 * One sentence comes back for every kind of failure that is about credentials:
 * no such address, wrong password, an account that only ever used Google. They
 * are indistinguishable on purpose, and they take roughly the same time, which
 * is what `fakeVerifyDelay` is for — a login form that answers "no such
 * account" in one millisecond and "wrong password" in two hundred is a way to
 * ask us who shops here.
 *
 * Two defences run at once. The rate limiter is keyed by IP and slows one
 * machine down; the failure counter lives on the account itself and holds it
 * shut after eight wrong passwords however many machines they came from.
 */
export async function POST(req: Request) {
  const limited = guard(req, [
    { key: "login", limit: 10, windowMs: 10 * 60 * 1000 },
    { key: "login:burst", limit: 5, windowMs: 60 * 1000 },
  ]);
  if (limited) return noStore(limited);

  const body = await readJson(req);
  if (!body) return noStore(fail(400, "Malformed request."));

  if (trippedHoneypot((body as { company?: unknown }).company)) {
    return noStore(fail(401, GENERIC, { code: "credentials" }));
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { email, password } = parsed.data;
  const next = safeNext((body as { next?: string }).next);

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // No row, or a Google-only account with no password to check. Both spend
    // the same time as a real comparison and give the same answer.
    if (!user?.passwordHash) {
      await fakeVerifyDelay();
      return noStore(fail(401, GENERIC, { code: "credentials" }));
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.max(1, Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000));
      return noStore(
        fail(429, `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, {
          code: "locked",
        })
      );
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const attempts = user.failedLoginCount + 1;
      const locked = attempts >= LIMITS.loginFailures;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: locked ? 0 : attempts,
          lockedUntil: locked
            ? new Date(Date.now() + LIMITS.loginLockMinutes * 60_000)
            : null,
        },
      });

      // Even the lock-out is worded so it does not confirm the address exists:
      // it is the same shape a rate-limited stranger sees.
      return noStore(
        locked
          ? fail(429, `Too many attempts. Try again in ${LIMITS.loginLockMinutes} minutes.`, {
              code: "locked",
            })
          : fail(401, GENERIC, { code: "credentials" })
      );
    }

    if (user.status === "SUSPENDED") {
      return noStore(
        fail(403, "This account is closed. Write to us and we will look into it.", {
          code: "suspended",
        })
      );
    }

    // The password was right, so saying what is outstanding tells the person
    // in front of us something they already know about their own account.
    if (!user.emailVerifiedAt) {
      await startPending(user);
      const issued = await issueEmailVerification(user);

      return noStore(
        fail(403, "Confirm your email address to finish setting up your account.", {
          code: "verify_email",
          ...(process.env.NODE_ENV !== "production" && issued.devCode
            ? { fields: { dev: `code ${issued.devCode}` } }
            : {}),
        })
      );
    }

    if (!user.phoneVerifiedAt && user.phone) {
      // Not a block — the dashboard prompts for it — but the code is sent now
      // so the prompt has something to accept.
      issuePhoneOtp({ id: user.id, phone: user.phone }).catch((err) =>
        console.error("[auth] login phone otp failed", err)
      );
    }

    await startSession(user, req);

    return noStore(
      ok({
        next,
        user: {
          fullName: user.fullName,
          email: user.email,
          emailVerified: true,
          phoneVerified: Boolean(user.phoneVerifiedAt),
        },
      })
    );
  } catch (err) {
    return noStore(serverError("login", err));
  }
}

const GENERIC = "Those details do not match an account.";
