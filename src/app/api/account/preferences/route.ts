import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { getPreferences, savePreferences } from "@/lib/account/preferences";
import { preferencesSchema } from "@/lib/account/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** What we may write to this member about. */
export async function GET() {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    return noStore(ok({ preferences: await getPreferences(user.id) }));
  } catch (err) {
    return noStore(serverError("preferences:get", err));
  }
}

/**
 * Changes one or more of them.
 *
 * A partial body on purpose: a single switch flips with a single field, so a
 * stale page cannot silently re-consent to the other four by sending back
 * values it loaded ten minutes ago.
 */
export async function PATCH(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`preferences:${user.id}`, 30, 10 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = preferencesSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  try {
    return noStore(ok({ preferences: await savePreferences(user.id, parsed.data) }));
  } catch (err) {
    return noStore(serverError("preferences:save", err));
  }
}
