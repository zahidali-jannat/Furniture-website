import "server-only";
import { prisma } from "@/lib/db";

/**
 * What we may write to somebody about.
 *
 * There is no row until a preference is expressed, so the defaults live here
 * as well as in the schema: replies to things the person started are on,
 * everything that is marketing is off. Consent is given, not assumed, and an
 * account that has never opened this page has consented to nothing.
 */

export type Preferences = {
  enquiryUpdates: boolean;
  consultationReminders: boolean;
  productUpdates: boolean;
  newCollections: boolean;
  promotions: boolean;
  preferredChannel: "email" | "phone";
};

export const DEFAULTS: Preferences = {
  enquiryUpdates: true,
  consultationReminders: true,
  productUpdates: false,
  newCollections: false,
  promotions: false,
  preferredChannel: "email",
};

/** What each switch actually means, in the words the visitor sees. */
export const DESCRIPTIONS: {
  key: keyof Omit<Preferences, "preferredChannel">;
  label: string;
  blurb: string;
  /** True for messages that answer something the person started. */
  transactional?: boolean;
}[] = [
  {
    key: "enquiryUpdates",
    label: "Enquiry replies",
    blurb: "When the workshop answers something you asked.",
    transactional: true,
  },
  {
    key: "consultationReminders",
    label: "Consultation reminders",
    blurb: "Confirmation of an appointment, and a note the day before.",
    transactional: true,
  },
  {
    key: "productUpdates",
    label: "Pieces you have saved",
    blurb: "If something you saved changes — a new finish, a lead time.",
  },
  {
    key: "newCollections",
    label: "New collections",
    blurb: "A few times a year, when a new run leaves the workshop.",
  },
  {
    key: "promotions",
    label: "Invitations and offers",
    blurb: "Private views, showroom evenings, the occasional offer.",
  },
];

export async function getPreferences(userId: string): Promise<Preferences> {
  const row = await prisma.userPreference.findUnique({ where: { userId } });
  if (!row) return DEFAULTS;

  return {
    enquiryUpdates: row.enquiryUpdates,
    consultationReminders: row.consultationReminders,
    productUpdates: row.productUpdates,
    newCollections: row.newCollections,
    promotions: row.promotions,
    preferredChannel: row.preferredChannel === "phone" ? "phone" : "email",
  };
}

export async function savePreferences(
  userId: string,
  changes: Partial<Preferences>
): Promise<Preferences> {
  const row = await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...DEFAULTS, ...changes },
    update: changes,
  });

  return {
    enquiryUpdates: row.enquiryUpdates,
    consultationReminders: row.consultationReminders,
    productUpdates: row.productUpdates,
    newCollections: row.newCollections,
    promotions: row.promotions,
    preferredChannel: row.preferredChannel === "phone" ? "phone" : "email",
  };
}
