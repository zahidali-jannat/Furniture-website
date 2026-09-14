import { prisma } from "@/lib/db";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { KINDS, createConsultation, listConsultations, slotProblem } from "@/lib/account/consultations";
import { consultationRequestSchema } from "@/lib/account/validation";
import { ensureProduct } from "@/lib/catalogue-db";
import { sendMail } from "@/lib/email/mailer";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What this account has asked for, split into what is coming and what has been. */
export async function GET() {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    const { upcoming, past } = await listConsultations(user.id);
    return noStore(ok({ upcoming, past }));
  } catch (err) {
    return noStore(serverError("consultations:list", err));
  }
}

/**
 * Asks for a time.
 *
 * Answers with the reference and the word "requested", because that is all
 * that has happened: the studio confirms by hand. Three open requests at once
 * is the limit — beyond that it is not a diary, it is a way to fill ours.
 */
export async function POST(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`consultation:${user.id}`, 6, 60 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = consultationRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  const { kind, when, note, productSlug } = parsed.data;

  const problem = slotProblem(when);
  if (problem) return noStore(fail(422, "Please check the form.", { fields: { when: problem } }));

  try {
    const open = await prisma.consultation.count({
      where: { userId: user.id, status: { in: ["REQUESTED", "CONFIRMED"] } },
    });

    if (open >= 3) {
      return noStore(
        fail(409, "You already have three appointments booked. Change one of those instead.", {
          code: "too_many",
        })
      );
    }

    const productId = productSlug ? await ensureProduct(productSlug) : null;
    const minutes = KINDS.find((k) => k.value === kind)?.minutes ?? 60;

    const consultation = await createConsultation({
      userId: user.id,
      kind,
      requestedAt: when,
      minutes,
      note,
      productId,
    });

    // The studio hears about it. Never blocks the visitor's reply.
    const inbox = process.env.MAIL_NOTIFY_TO;
    if (inbox) {
      sendMail({
        to: inbox,
        subject: `Consultation requested — ${consultation.reference}`,
        html: `<p>${escapeHtml(user.fullName)} asked for a ${kind.toLowerCase()} consultation on ${when.toUTCString()}.</p>`,
        text: `${user.fullName} asked for a ${kind.toLowerCase()} consultation on ${when.toUTCString()}. Reference ${consultation.reference}.`,
        replyTo: user.email,
      }).catch((err) => console.error("[mail] consultation notice failed", err));
    }

    return noStore(ok({ consultation, brand: BRAND.wordmark }));
  } catch (err) {
    return noStore(serverError("consultations:create", err));
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
