import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { afterVerification } from "@/lib/auth/finish";
import { verificationSubject } from "@/lib/auth/pending";
import { verifyCodeSchema } from "@/lib/auth/validation";
import { checkEmailCode, explainCheck } from "@/lib/auth/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirms the six digits from the verification email. */
export async function POST(req: Request) {
  const subject = await verificationSubject();
  if (!subject)
    return noStore(
      fail(401, "That registration has expired. Please start again.", { code: "expired" })
    );

  // Keyed by account, not by IP: the attacker chooses the IP, never the account.
  const limited = guardSubject(`verify:email:${subject.userId}`, 10, 10 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = verifyCodeSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error, "Enter the six digits from the email."));

  try {
    const result = await checkEmailCode(subject.userId, parsed.data.code);

    if (!result.ok) {
      return noStore(
        fail(422, explainCheck(result), {
          code: result.reason,
          fields: { code: explainCheck(result) },
        })
      );
    }

    const status = await afterVerification(subject, req);
    return noStore(ok({ ...status, next: status.complete ? "/account" : null }));
  } catch (err) {
    return noStore(serverError("verify/email", err));
  }
}
