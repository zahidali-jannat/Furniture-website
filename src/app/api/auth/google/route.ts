import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE, TTL, appOrigin, googleConfigured } from "@/lib/auth/config";
import { setCookie } from "@/lib/auth/cookies";
import { noStore } from "@/lib/auth/http";
import { signOAuthState } from "@/lib/auth/jwt";
import { opaqueToken } from "@/lib/auth/tokens";
import { safeNext } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts the round trip to Google.
 *
 * The three values that make the return leg trustworthy are minted here and
 * kept in one signed, httpOnly cookie: `state`, which ties the callback to
 * this browser; `nonce`, which ties the id_token to this attempt; and the PKCE
 * verifier, which makes an intercepted authorization code useless to whoever
 * intercepted it.
 */
export async function GET(req: Request) {
  const next = safeNext(new URL(req.url).searchParams.get("next"));

  if (!googleConfigured()) {
    // Nothing half-built and nothing cryptic: the button is not offered when
    // this is unset, so arriving here means somebody kept a stale link.
    return noStore(
      NextResponse.redirect(new URL("/login?reason=google_unavailable", appOrigin()), 303)
    );
  }

  const state = opaqueToken();
  const nonce = opaqueToken();
  const verifier = opaqueToken();
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  await setCookie(COOKIE.oauth, await signOAuthState({ state, verifier, nonce, next }), {
    maxAgeSeconds: TTL.oauthMinutes * 60,
  });

  const { authorizeUrl } = await import("@/lib/auth/google");

  return noStore(NextResponse.redirect(authorizeUrl({ state, nonce, challenge }), 303));
}
