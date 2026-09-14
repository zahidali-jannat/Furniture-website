import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { listSessions, revokeAllSessions, startSession, verifiedUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The devices currently signed in to this account. */
export async function GET() {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    const sessions = await listSessions(user.id);

    return noStore(
      ok({
        items: sessions.map((session) => ({
          id: session.id,
          device: describe(session.userAgent),
          ip: session.ip,
          startedAt: session.createdAt.toISOString(),
          lastUsedAt: session.lastUsedAt.toISOString(),
        })),
      })
    );
  } catch (err) {
    return noStore(serverError("sessions:list", err));
  }
}

/**
 * Signs every device out, then signs this one back in.
 *
 * The alternative — revoking everything including the browser that asked —
 * dumps someone on the sign-in page for pressing a reassurance button.
 */
export async function DELETE(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    await revokeAllSessions(user.id, "signed out everywhere");
    await startSession(user, req);
    return noStore(ok({ signedOutElsewhere: true }));
  } catch (err) {
    return noStore(serverError("sessions:revoke", err));
  }
}

/**
 * A user-agent string, reduced to something a person recognises.
 *
 * Deliberately rough. This is a memory aid for "was that me last Tuesday",
 * not device forensics, and a full parser is a dependency that needs updating
 * every time a browser changes its string.
 */
function describe(ua: string | null): string {
  if (!ua) return "Unknown device";

  const browser =
    /edg\//i.test(ua) ? "Edge"
    : /opr\//i.test(ua) ? "Opera"
    : /chrome\//i.test(ua) ? "Chrome"
    : /safari\//i.test(ua) ? "Safari"
    : /firefox\//i.test(ua) ? "Firefox"
    : "Browser";

  const platform =
    /iphone|ipad/i.test(ua) ? "iOS"
    : /android/i.test(ua) ? "Android"
    : /mac os x/i.test(ua) ? "macOS"
    : /windows/i.test(ua) ? "Windows"
    : /linux/i.test(ua) ? "Linux"
    : "";

  return platform ? `${browser} on ${platform}` : browser;
}
