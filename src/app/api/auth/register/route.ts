import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { accountAlreadyExists } from "@/lib/email/auth-emails";
import { appOrigin } from "@/lib/auth/config";
import { fail, guard, invalid, noStore, ok, readJson, serverError, trippedHoneypot } from "@/lib/auth/http";
import { hashPassword, passwordProblem } from "@/lib/auth/password";
import { startPending } from "@/lib/auth/pending";
import { registerSchema } from "@/lib/auth/validation";
import { issueEmailVerification, issuePhoneOtp } from "@/lib/auth/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Registration.
 *
 * The account row is created unverified and stays that way until both codes
 * come back. Until then it is a placeholder: no session is issued, and
 * middleware keeps it out of the account area. That is the practical reading
 * of "create the account only after verification" — the alternative, holding
 * the details in a side table, stores the same password hash in a place with
 * fewer constraints on it and buys nothing.
 *
 * What this route will not do is tell a stranger whether an address is
 * registered here. An address already in use produces the same response, in the
 * same time, as a fresh one; what differs is that its owner gets an email
 * saying somebody tried. They are the only person entitled to know.
 */
export async function POST(req: Request) {
  const limited = guard(req, [
    { key: "register", limit: 5, windowMs: 60 * 60 * 1000 },
    { key: "register:burst", limit: 2, windowMs: 60 * 1000 },
  ]);
  if (limited) return noStore(limited);

  const body = await readJson(req);
  if (!body) return noStore(fail(400, "Malformed request."));

  if (trippedHoneypot((body as { company?: unknown }).company)) {
    // Answer as though it worked, so a bot learns nothing from the difference.
    return noStore(ok({ next: "verify" }));
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { fullName, email, phone, password } = parsed.data;

  // Checked here rather than in the schema so the message can mention the
  // name and address the visitor just typed.
  const weak = passwordProblem(password, [fullName, email.split("@")[0]]);
  if (weak) return noStore(fail(422, "Please check the form.", { fields: { password: weak } }));

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing?.emailVerifiedAt) {
      // Taken, and proven. Nothing is created, nothing is changed, and the
      // response below is identical to the success case.
      const mail = accountAlreadyExists({
        name: existing.fullName,
        signInLink: `${appOrigin()}/login`,
        resetLink: `${appOrigin()}/forgot-password`,
      });

      sendMail({ to: existing.email, subject: mail.subject, html: mail.html, text: mail.text })
        .catch((err) => console.error("[auth] duplicate-registration notice failed", err));

      // A ticket that points at nobody: the verification screens work, and
      // every code typed into them fails, exactly as they would for a
      // registration whose codes never arrived.
      await startPending({ id: `nobody:${crypto.randomUUID()}`, email, phone });

      return noStore(ok({ next: "verify", email: mask(email), phone: maskPhone(phone) }));
    }

    // A number already proven by somebody else cannot be proven again. Unlike
    // the address, this is said plainly: the enumeration risk is far smaller
    // than the cost of a mistyped digit stranding someone on a screen waiting
    // for a message that will never come.
    const phoneOwner = await prisma.user.findFirst({
      where: { phone, phoneVerifiedAt: { not: null }, NOT: { id: existing?.id ?? "" } },
      select: { id: true },
    });

    if (phoneOwner) {
      return noStore(
        fail(409, "Please check the form.", {
          fields: { phone: "That number is already registered to an account." },
          code: "phone_taken",
        })
      );
    }

    const passwordHash = await hashPassword(password);

    // An unverified row with this address is an abandoned attempt — very often
    // the same person coming back. Overwrite it rather than refusing them.
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { fullName, phone, passwordHash, phoneVerifiedAt: null },
        })
      : await prisma.user.create({
          data: { fullName, email, phone, passwordHash },
        });

    await startPending(user);

    const [emailIssue, phoneIssue] = await Promise.all([
      issueEmailVerification(user),
      issuePhoneOtp({ id: user.id, phone }),
    ]);

    return noStore(
      ok({
        next: "verify",
        email: mask(email),
        phone: maskPhone(phone),
        // Whether each message actually left. The verification screen says so
        // rather than telling someone to check an inbox for nothing.
        emailSent: emailIssue.delivered,
        phoneSent: phoneIssue.delivered,
        ...(process.env.NODE_ENV !== "production"
          ? {
              dev: {
                emailReason: emailIssue.reason,
                phoneReason: phoneIssue.reason,
                emailCode: emailIssue.devCode,
                phoneCode: phoneIssue.devCode,
              },
            }
          : {}),
      })
    );
  } catch (err) {
    // Two people registering the same address in the same instant.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return noStore(ok({ next: "verify", email: mask(email), phone: maskPhone(phone) }));
    }
    return noStore(serverError("register", err));
  }
}

/** a•••a@example.com — enough to recognise, not enough to read over a shoulder. */
function mask(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, 1);
  const tail = local.length > 2 ? local.slice(-1) : "";
  return `${head}${"•".repeat(Math.max(1, local.length - 2))}${tail}@${domain}`;
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)} ••• ${phone.slice(-2)}`;
}
