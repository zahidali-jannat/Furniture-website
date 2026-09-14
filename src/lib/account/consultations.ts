import "server-only";
import type { ConsultationKind, ConsultationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withReference } from "./reference";
import { showroomParts } from "./zone";

/**
 * Appointments with the studio.
 *
 * The visitor *requests* a time; the workshop confirms it. That is how the
 * showroom already works — the enquiry confirmation says somebody will reply
 * to arrange one — and it is the honest shape for a business with two rooms
 * and no booking system. A self-service calendar that issued confirmations
 * nobody had agreed to would look more finished and mean less.
 */

export const KINDS: { value: ConsultationKind; label: string; blurb: string; minutes: number }[] = [
  {
    value: "SHOWROOM",
    label: "Showroom visit",
    blurb: "Sit in the pieces. No appointment fee and nothing to sign.",
    minutes: 60,
  },
  {
    value: "PRODUCT",
    label: "Product consultation",
    blurb: "One piece, in detail — proportions, materials, lead time.",
    minutes: 45,
  },
  {
    value: "INTERIOR",
    label: "Interior consultation",
    blurb: "A room, or a whole floor. Bring dimensions if you have them.",
    minutes: 90,
  },
  {
    value: "CUSTOM",
    label: "Custom commission",
    blurb: "Something the catalogue does not hold, made for one room.",
    minutes: 90,
  },
  {
    value: "MATERIAL",
    label: "Materials and finishes",
    blurb: "Wools, bouclés, oak and walnut, in daylight and in hand.",
    minutes: 45,
  },
];

export function kindLabel(kind: ConsultationKind): string {
  return KINDS.find((k) => k.value === kind)?.label ?? "Consultation";
}

export const STATUS_LABEL: Record<ConsultationStatus, string> = {
  REQUESTED: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/**
 * The showroom is open by appointment, Tuesday to Saturday, 10 until 6 — the
 * same hours the enquiry email has always quoted. Requests outside them are
 * refused here rather than accepted and then quietly moved.
 */
export const OPEN_DAYS = [2, 3, 4, 5, 6]; // Tue–Sat, as Date#getDay
export const OPEN_FROM = 10;
export const OPEN_UNTIL = 18;

export type SlotProblem = string | null;

export function slotProblem(when: Date): SlotProblem {
  if (Number.isNaN(when.getTime())) return "That is not a date we can read.";

  const now = Date.now();
  // A day's notice: somebody has to read the request and answer it.
  if (when.getTime() < now + 20 * 60 * 60 * 1000)
    return "Please choose a time at least a day from now.";
  if (when.getTime() > now + 180 * 86_400_000)
    return "We cannot look further ahead than six months.";

  // Read on the showroom's clock, not the server's: a Saturday evening here
  // can still be Saturday afternoon there, and it is there that matters.
  const local = showroomParts(when);

  if (!OPEN_DAYS.includes(local.day))
    return "The showroom is open Tuesday to Saturday.";

  const hour = local.hour + local.minute / 60;
  if (hour < OPEN_FROM || hour > OPEN_UNTIL - 0.5)
    return "We are open between 10 in the morning and 6 in the evening.";

  return null;
}

export function createConsultation(data: {
  userId: string;
  kind: ConsultationKind;
  requestedAt: Date;
  minutes: number;
  note?: string | null;
  productId?: string | null;
}) {
  return withReference((reference) =>
    prisma.consultation.create({
      data: {
        reference,
        userId: data.userId,
        kind: data.kind,
        requestedAt: data.requestedAt,
        minutes: data.minutes,
        note: data.note ?? null,
        productId: data.productId ?? null,
        location: "The Copenhagen showroom",
      },
      select: { reference: true, requestedAt: true, kind: true, status: true },
    })
  );
}

const LIST_SELECT = {
  reference: true,
  kind: true,
  status: true,
  requestedAt: true,
  confirmedAt: true,
  minutes: true,
  location: true,
  consultant: true,
  note: true,
  cancelledAt: true,
  createdAt: true,
  product: { select: { slug: true, name: true, category: { select: { slug: true, title: true } } } },
} as const;

/**
 * Everything this account has asked for, split the way a person thinks about
 * it: what is still to come, and what has already happened.
 */
export async function listConsultations(userId: string) {
  const rows = await prisma.consultation.findMany({
    where: { userId },
    orderBy: { requestedAt: "asc" },
    select: LIST_SELECT,
  });

  const now = new Date();
  const upcoming = rows.filter(
    (row) =>
      row.status !== "CANCELLED" &&
      row.status !== "COMPLETED" &&
      (row.confirmedAt ?? row.requestedAt) >= now
  );

  const past = rows
    .filter((row) => !upcoming.includes(row))
    .sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());

  return { upcoming, past };
}

export function getConsultation(userId: string, reference: string) {
  // Scoped by user id in the same query: a reference somebody guessed is still
  // not theirs to read.
  return prisma.consultation.findFirst({
    where: { userId, reference },
    select: LIST_SELECT,
  });
}
