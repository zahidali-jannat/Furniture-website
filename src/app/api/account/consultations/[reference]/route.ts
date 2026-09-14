import { prisma } from "@/lib/db";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { getConsultation, slotProblem } from "@/lib/account/consultations";
import { tidyReference } from "@/lib/account/reference";
import {
  consultationCancelSchema,
  consultationRescheduleSchema,
} from "@/lib/account/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ reference: string }> };

/**
 * One appointment: read it, move it, or call it off.
 *
 * Every query is scoped by the signed-in user's id as well as the reference,
 * so a reference somebody guessed — or read over a shoulder — is still not
 * theirs to open.
 */
export async function GET(_req: Request, { params }: Params) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    const consultation = await getConsultation(user.id, tidyReference((await params).reference));
    if (!consultation) return noStore(fail(404, "We cannot find that appointment."));

    return noStore(ok({ consultation }));
  } catch (err) {
    return noStore(serverError("consultations:get", err));
  }
}

/**
 * Moves it.
 *
 * A confirmed appointment that is moved goes back to requested: the new time
 * is a request like any other, and showing "confirmed" against a time nobody
 * has agreed to would be the one thing this section must never do.
 */
export async function PATCH(req: Request, { params }: Params) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`consultation:move:${user.id}`, 10, 60 * 60 * 1000);
  if (limited) return noStore(limited);

  const reference = tidyReference((await params).reference);
  const parsed = consultationRescheduleSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  const problem = slotProblem(parsed.data.when);
  if (problem) return noStore(fail(422, "Please check the form.", { fields: { when: problem } }));

  try {
    const existing = await prisma.consultation.findFirst({
      where: { userId: user.id, reference },
      select: { id: true, status: true },
    });

    if (!existing) return noStore(fail(404, "We cannot find that appointment."));
    if (existing.status === "CANCELLED" || existing.status === "COMPLETED") {
      return noStore(
        fail(409, "That appointment is closed. Ask for a new one instead.", { code: "closed" })
      );
    }

    await prisma.consultation.update({
      where: { id: existing.id },
      data: {
        requestedAt: parsed.data.when,
        confirmedAt: null,
        status: "REQUESTED",
      },
    });

    return noStore(ok({ moved: true }));
  } catch (err) {
    return noStore(serverError("consultations:move", err));
  }
}

/** Calls it off. The row stays, so the studio can see what happened. */
export async function DELETE(req: Request, { params }: Params) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const reference = tidyReference((await params).reference);
  const body = await readJson(req);
  const parsed = consultationCancelSchema.safeParse(body ?? {});

  try {
    const existing = await prisma.consultation.findFirst({
      where: { userId: user.id, reference },
      select: { id: true, status: true },
    });

    if (!existing) return noStore(fail(404, "We cannot find that appointment."));
    if (existing.status === "CANCELLED") return noStore(ok({ cancelled: true }));

    await prisma.consultation.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: parsed.success ? (parsed.data.reason ?? null) : null,
      },
    });

    return noStore(ok({ cancelled: true }));
  } catch (err) {
    return noStore(serverError("consultations:cancel", err));
  }
}
