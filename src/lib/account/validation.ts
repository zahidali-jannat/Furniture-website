import { z } from "zod";
import { fromShowroomLocal } from "./zone";

/**
 * Request shapes for the account portal, kept beside the account services
 * rather than in the auth ones — these describe what a member may ask for,
 * not how they prove who they are.
 */

export const consultationKindSchema = z.enum([
  "PRODUCT",
  "INTERIOR",
  "CUSTOM",
  "SHOWROOM",
  "MATERIAL",
]);

/**
 * A datetime-local input sends "2026-10-03T15:30" with no zone attached.
 *
 * It is read as showroom time rather than server time, because the appointment
 * happens in a room in Copenhagen and that is the only clock anybody will be
 * standing under. Parsed in the server's zone instead, a request for three in
 * the afternoon becomes half past eleven the moment the site is hosted
 * somewhere else — which is precisely what went wrong the first time.
 */
const whenSchema = z
  .string()
  .trim()
  .min(1, "Choose a day and a time.")
  .transform((value) => fromShowroomLocal(value))
  .refine((date) => !Number.isNaN(date.getTime()), "That is not a date we can read.");

export const consultationRequestSchema = z.object({
  kind: consultationKindSchema,
  when: whenSchema,
  note: z.string().trim().max(1000, "That is longer than we can store.").optional(),
  productSlug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Unknown piece.")
    .optional(),
});

export const consultationRescheduleSchema = z.object({ when: whenSchema });

export const consultationCancelSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const preferencesSchema = z
  .object({
    enquiryUpdates: z.boolean(),
    consultationReminders: z.boolean(),
    productUpdates: z.boolean(),
    newCollections: z.boolean(),
    promotions: z.boolean(),
    preferredChannel: z.enum(["email", "phone"]),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Nothing to change.");

export const accountEnquirySchema = z.object({
  productSlug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Unknown piece.")
    .optional(),
  subject: z.string().trim().max(120).optional(),
  message: z
    .string()
    .trim()
    .min(10, "A line or two about what you are after.")
    .max(2000, "That is longer than we can store."),
});
