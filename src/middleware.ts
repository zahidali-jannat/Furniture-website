import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "@/lib/auth/config";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * The gate in front of the account area.
 *
 * This runs on the edge, before any page renders, and it is deliberately the
 * cheapest possible check: verify the signature on the access token and read
 * two flags. No database, no Prisma — those are not available here and, more
 * to the point, a query on every navigation to decide whether to render a page
 * is a tax on the whole site.
 *
 * It is a gate, not the lock. The pages and routes behind it each re-check the
 * session against the database, because a token that was valid when it was
 * signed can describe an account that has since been closed. Middleware turns
 * away the obvious; the routes are what actually protect anything.
 *
 * Three outcomes for a protected page:
 *
 *   · a live access token, email proven — through, no redirect
 *   · no access token but a refresh token — a trip through /api/auth/refresh
 *     and straight back, which is the fifteen-minute expiry being handled
 *     without the visitor noticing
 *   · neither — the sign-in page, remembering where they were going
 */

const PROTECTED = ["/account"];
const SIGNED_OUT_ONLY = ["/login", "/create-account", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const claims = await verifyAccessToken(req.cookies.get(COOKIE.access)?.value);
  const hasRefresh = Boolean(req.cookies.get(COOKIE.refresh)?.value);

  if (PROTECTED.some((base) => pathname === base || pathname.startsWith(`${base}/`))) {
    if (claims?.ev) return NextResponse.next();

    // Signed in, but the address is still unproven. The account area stays
    // shut until it is — which is the whole point of verifying it.
    if (claims && !claims.ev) {
      return NextResponse.redirect(new URL("/create-account/verify", req.url));
    }

    if (hasRefresh) {
      const to = new URL("/api/auth/refresh", req.url);
      to.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(to);
    }

    const to = new URL("/login", req.url);
    to.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(to);
  }

  // Somebody already signed in has no business on the sign-in page. The
  // verification screen is the exception: finishing a registration is exactly
  // what a half-verified session is for.
  if (claims?.ev && SIGNED_OUT_ONLY.some((base) => pathname === base)) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/login",
    "/create-account",
    "/forgot-password",
    "/reset-password",
  ],
};
