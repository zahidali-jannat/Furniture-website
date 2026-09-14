import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE, appOrigin, googleConfigured } from "@/lib/auth/config";
import { clearCookie, readCookie } from "@/lib/auth/cookies";
import { exchangeCode, resolveGoogleUser } from "@/lib/auth/google";
import { noStore } from "@/lib/auth/http";
import { verifyOAuthState } from "@/lib/auth/jwt";
import { startSession } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The return leg from Google.
 *
 * Every failure lands the visitor back on the sign-in page with a short reason
 * they can read; the detail goes to the log. The cookie holding the state and
 * the PKCE verifier is cleared first thing, whatever happens next, so a
 * failed attempt cannot be retried with the same values.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;

  const ticket = await verifyOAuthState(await readCookie(COOKIE.oauth));
  await clearCookie(COOKIE.oauth);

  const next = safeNext(ticket?.next);

  if (!googleConfigured()) return back("google_unavailable", next);

  // The visitor pressed cancel, or Google refused. Not an error worth a page.
  if (params.get("error")) {
    return back(params.get("error") === "access_denied" ? "google_cancelled" : "google_failed", next);
  }

  const code = params.get("code");
  const state = params.get("state");

  if (!ticket || !code || !state) return back("google_expired", next);
  if (!sameString(state, ticket.state)) return back("google_state", next);

  try {
    const identity = await exchangeCode(code, ticket.verifier, ticket.nonce);

    // Google knows the address but has not confirmed it belongs to this
    // person. Accepting it would be a way into somebody else's account.
    if (!identity) return back("google_unverified", next);

    const { user, created } = await resolveGoogleUser(identity);

    if (user.status === "SUSPENDED") return back("suspended", next);

    await startSession(user, req);

    // A brand-new Google account has no phone number yet; the dashboard opens
    // on the prompt for it rather than making them hunt for the setting.
    const destination = created ? `${next}?welcome=1` : next;

    return noStore(NextResponse.redirect(new URL(destination, appOrigin()), 303));
  } catch (err) {
    console.error("[auth] google callback", err);
    return back("google_failed", next);
  }
}

function back(reason: string, next: string) {
  const to = new URL("/login", appOrigin());
  to.searchParams.set("reason", reason);
  if (next !== "/account") to.searchParams.set("next", next);
  return noStore(NextResponse.redirect(to, 303));
}

/** Constant-time string comparison, so the state cannot be guessed a byte at a time. */
function sameString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
