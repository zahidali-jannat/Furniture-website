import "server-only";
import type { EnquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { withReference } from "./reference";

/**
 * Enquiries, from the account's side.
 *
 * An enquiry is a conversation the workshop answers by email or in the
 * showroom; this is the record of it, not a replacement for it. Hence one
 * written response rather than a message thread — a chat window nobody is
 * watching is worse than an honest "we will write to you".
 */

export const STATUS: Record<EnquiryStatus, { label: string; note: string }> = {
  SUBMITTED: { label: "Submitted", note: "With the workshop. We reply within two working days." },
  UNDER_REVIEW: { label: "Under review", note: "Somebody is looking into it." },
  AWAITING_RESPONSE: { label: "Awaiting your reply", note: "We have written to you and are waiting." },
  CONSULTATION_SCHEDULED: { label: "Consultation arranged", note: "A time has been set." },
  RESOLVED: { label: "Resolved", note: "Answered. Write again any time." },
  CLOSED: { label: "Closed", note: "Closed without a reply needed." },
};

/** Open as far as the visitor is concerned — the ones still going somewhere. */
export const OPEN_STATUSES: EnquiryStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "AWAITING_RESPONSE",
  "CONSULTATION_SCHEDULED",
];

const DETAIL_SELECT = {
  reference: true,
  subject: true,
  message: true,
  status: true,
  response: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
  email: true,
  phone: true,
  product: {
    select: {
      slug: true,
      name: true,
      note: true,
      category: { select: { slug: true, title: true } },
      images: { where: { primary: true }, take: 1, select: { url: true, width: true, height: true } },
    },
  },
} as const;

/**
 * Matched by account id and by the verified address on the account, so an
 * enquiry sent before registering — usually the first one, the one that
 * brought them here — is waiting for them afterwards.
 */
export function listEnquiries(user: { id: string; email: string }) {
  return prisma.enquiry.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: DETAIL_SELECT,
  });
}

export function getEnquiry(user: { id: string; email: string }, reference: string) {
  return prisma.enquiry.findFirst({
    where: { reference, OR: [{ userId: user.id }, { email: user.email }] },
    select: DETAIL_SELECT,
  });
}

export function createEnquiry(data: {
  userId?: string | null;
  email: string;
  name?: string | null;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  productId?: string | null;
}) {
  return withReference((reference) =>
    prisma.enquiry.create({
      data: {
        reference,
        userId: data.userId ?? null,
        email: data.email,
        name: data.name ?? null,
        phone: data.phone ?? null,
        subject: data.subject ?? null,
        message: data.message ?? null,
        productId: data.productId ?? null,
      },
      select: { reference: true, createdAt: true },
    })
  );
}
