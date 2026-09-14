import { z } from "zod";
import { LIMITS } from "./config";

/**
 * One schema per request body, shared by the route that receives it and — for
 * the shapes worth checking twice — the form that sends it.
 *
 * Validation is never only client-side here. The forms use these rules to say
 * something useful before a round trip; the routes use them because the form
 * is not the only thing that can post.
 */

/** Lower-cased and trimmed, so "Anna@Example.com " and "anna@example.com" are one account. */
export const emailSchema = z
  .string()
  .trim()
  .min(3, "Enter your email address.")
  .max(254, "That address is too long.")
  .toLowerCase()
  .refine(
    (v) => /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+(\.[^\s@.,;:<>()[\]\\]+)+$/.test(v),
    "That address does not look right."
  );

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Tell us your name.")
  .max(80, "That name is longer than we can store.")
  .refine((v) => /\p{L}/u.test(v), "That name does not look right.");

/**
 * Phone numbers are stored in E.164 and nothing else.
 *
 * Spaces, dashes and brackets are how people write numbers and are stripped
 * here rather than nagged about. The country code is not optional: without one
 * a number is ambiguous, and an SMS gateway will either guess wrong or refuse.
 * Full E.164 parsing is a library's worth of country rules — deliberately not
 * taken on for a form that only needs to reach a gateway that validates again.
 */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .refine((v) => v.startsWith("+"), "Include your country code, such as +45.")
  .refine((v) => /^\+[1-9]\d{7,14}$/.test(v), "That number does not look right.");

export const passwordSchema = z
  .string()
  .min(LIMITS.passwordMin, `Use at least ${LIMITS.passwordMin} characters.`)
  .max(LIMITS.passwordMax, "That is longer than we can store.");

export const codeSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, ""))
  .refine((v) => /^\d{6}$/.test(v), "Enter the six digits from the message.");

export const registerSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    /** Honeypot. A real person never fills a field they cannot see. */
    company: z.string().optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Those two passwords are not the same.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  company: z.string().optional(),
});

export const verifyCodeSchema = z.object({ code: codeSchema });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  company: z.string().optional(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "That link is not valid."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Those two passwords are not the same.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Those two passwords are not the same.",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

export const deleteAccountSchema = z.object({
  /** Typed back by hand, so nobody deletes an account by mis-clicking. */
  confirm: z.literal("DELETE", {
    message: 'Type DELETE in capitals to confirm.',
  }),
  password: z.string().optional(),
});

export const savedProductSchema = z.object({
  productSlug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Unknown piece."),
  note: z.string().trim().max(280).optional(),
});

/** Flattens a Zod failure into `{ field: message }` for the form to render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

/**
 * A redirect target the visitor supplied.
 *
 * Anything that is not a path on this site is dropped: "//evil.example" and
 * "https://evil.example" are both absolute despite the first one looking
 * relative, which is the classic open-redirect. Backslashes are normalised
 * because some browsers treat them as slashes.
 */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  const value = raw.replace(/\\/g, "/");
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
