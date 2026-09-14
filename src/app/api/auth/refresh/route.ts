import { NextResponse } from "next/server";
import { appOrigin } from "@/lib/auth/config";
import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { refreshSession, sweepSessions } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Trades a refresh token for a new pair.
 *
 * Two doors into the same work. GET is the one middleware uses: a page was
 * requested with a live refresh token and a dead access token, so the visitor
 * is bounced through here and back to where they were going, which is the
 * whole of what they see. POST is for the dashboard's own fetches, which would
 * rather have JSON than a redirect.
 *
 * Housekeeping runs here because this is the one route that is called
 * regularly by every signed-in device and by nobody else, and this project has
 * no scheduler.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));

  try {
    const result = await refreshSession(req);

    // Relative to this deployment's own origin, never to the Host header,
    // which a client controls.
    const to = new URL(
      result.ok ? next : `/login?next=${encodeURIComponent(next)}&reason=expired`,
      appOrigin()
    );

    sweepSessions().catch(() => {});

    return noStore(NextResponse.redirect(to, { status: 303 }));
  } catch (err) {
    console.error("[auth] refresh (redirect)", err);
    return noStore(NextResponse.redirect(new URL("/login?reason=error", appOrigin()), 303));
  }
}

export async function POST(req: Request) {
  try {
    const result = await refreshSession(req);

    if (!result.ok) {
      return noStore(
        fail(401, "Your session has ended. Please sign in again.", { code: result.reason })
      );
    }

    sweepSessions().catch(() => {});

    return noStore(
      ok({
        user: {
          fullName: result.user.fullName,
          email: result.user.email,
          emailVerified: Boolean(result.user.emailVerifiedAt),
          phoneVerified: Boolean(result.user.phoneVerifiedAt),
        },
      })
    );
  } catch (err) {
    return noStore(serverError("refresh", err));
  }
}
