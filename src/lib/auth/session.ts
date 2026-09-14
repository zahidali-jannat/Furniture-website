import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { COOKIE, TTL } from "./config";
import { clearAuthCookies, readCookie, setAuthCookies, setCookie } from "./cookies";
import { signAccessToken, verifyAccessToken } from "./jwt";
import { daysFromNow, digest, opaqueToken } from "./tokens";

/**
 * Sessions.
 *
 * A signed-in device holds two things: a fifteen-minute access token, which is
 * a JWT and is trusted on sight, and a thirty-day refresh token, which is
 * opaque and is checked against the database every time it is used.
 *
 * Refresh tokens rotate. Each use issues a new one and marks the old row
 * revoked rather than deleting it, which is what makes theft detectable: if a
 * token that has already been spent turns up again, either the attacker or the
 * real visitor is using a copy, and there is no way to tell which — so every
 * session on the account is revoked and both of them have to sign in again.
 * That is the intended outcome. A silent takeover is worse than an interruption.
 */

export type SessionUser = Pick<
  User,
  | "id"
  | "fullName"
  | "email"
  | "phone"
  | "emailVerifiedAt"
  | "phoneVerifiedAt"
  | "avatarUrl"
  | "status"
  | "passwordHash"
  | "createdAt"
  | "lastLoginAt"
>;

const SESSION_FIELDS = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  avatarUrl: true,
  status: true,
  passwordHash: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/** Signs the visitor in on this device and sets both cookies. */
export async function startSession(user: SessionUser, req: Request) {
  const refreshToken = opaqueToken();

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: digest(refreshToken),
      userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
      ip: clientIp(req),
      expiresAt: daysFromNow(TTL.refreshDays),
    },
  });

  const accessToken = await mintAccess(user, session.id);
  await setAuthCookies(accessToken, refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
  });

  return { sessionId: session.id };
}

function mintAccess(user: SessionUser, sessionId: string) {
  return signAccessToken({
    sub: user.id,
    sid: sessionId,
    ev: Boolean(user.emailVerifiedAt),
    pv: Boolean(user.phoneVerifiedAt),
    name: user.fullName,
  });
}

type RefreshOutcome =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "missing" | "unknown" | "expired" | "reused" | "gone" };

/**
 * Exchanges a refresh token for a fresh pair.
 *
 * Called by /api/auth/refresh, which middleware redirects to when a page is
 * requested with a live refresh token and a dead access token. The visitor
 * sees a redirect and nothing else.
 */
export async function refreshSession(req: Request): Promise<RefreshOutcome> {
  const presented = await readCookie(COOKIE.refresh);
  if (!presented) return { ok: false, reason: "missing" };

  const existing = await prisma.session.findUnique({
    where: { refreshTokenHash: digest(presented) },
    include: { user: { select: SESSION_FIELDS } },
  });

  if (!existing) {
    await clearAuthCookies();
    return { ok: false, reason: "unknown" };
  }

  if (existing.revokedAt) {
    // A spent token, presented again. Assume the worst and end everything.
    await revokeAllSessions(existing.userId, "refresh token reuse");
    await clearAuthCookies();
    return { ok: false, reason: "reused" };
  }

  if (existing.expiresAt < new Date()) {
    await prisma.session.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), revokedReason: "expired" },
    });
    await clearAuthCookies();
    return { ok: false, reason: "expired" };
  }

  if (existing.user.status === "SUSPENDED") {
    await revokeAllSessions(existing.userId, "account suspended");
    await clearAuthCookies();
    return { ok: false, reason: "gone" };
  }

  const nextToken = opaqueToken();

  // Both writes or neither: a crash between them would either leave the
  // visitor holding a token no row knows about, or leave two live tokens.
  const [, replacement] = await prisma.$transaction([
    prisma.session.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), revokedReason: "rotated" },
    }),
    prisma.session.create({
      data: {
        userId: existing.userId,
        refreshTokenHash: digest(nextToken),
        userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
        ip: clientIp(req),
        expiresAt: existing.expiresAt,
      },
    }),
  ]);

  const accessToken = await mintAccess(existing.user, replacement.id);
  await setAuthCookies(accessToken, nextToken);

  return { ok: true, user: existing.user };
}

/** Ends this device's session. Other devices stay signed in. */
export async function endSession() {
  const presented = await readCookie(COOKIE.refresh);

  if (presented) {
    await prisma.session.updateMany({
      where: { refreshTokenHash: digest(presented), revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "signed out" },
    });
  }

  await clearAuthCookies();
}

export async function revokeAllSessions(userId: string, reason: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

/**
 * Who is making this request, or null.
 *
 * The access token is trusted for identity but not for state: the row is read
 * back so that a verification completed, or an account deleted, one second ago
 * is reflected immediately rather than fifteen minutes later.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const claims = await verifyAccessToken(await readCookie(COOKIE.access));
  if (!claims?.sub || !claims.sid) return null;

  const session = await prisma.session.findUnique({
    where: { id: claims.sid },
    select: { revokedAt: true, expiresAt: true },
  });

  // Revoking a session has to take effect now, not when the access token
  // happens to expire.
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: SESSION_FIELDS,
  });

  if (!user || user.status === "SUSPENDED") return null;

  return user;
}

/** Signed in *and* proven — what every protected route actually requires. */
export async function verifiedUser(): Promise<SessionUser | null> {
  const user = await currentUser();
  return user?.emailVerifiedAt ? user : null;
}

/**
 * Re-signs the access token for the device making this request.
 *
 * The token carries the verification flags, so confirming a phone number from
 * inside the dashboard would otherwise not show up until the token expired a
 * quarter of an hour later. Silently does nothing if there is no live token to
 * replace — middleware will mint a fresh one on the next navigation.
 */
export async function reissueAccess(user: SessionUser): Promise<void> {
  const claims = await verifyAccessToken(await readCookie(COOKIE.access));
  if (!claims?.sid || claims.sub !== user.id) return;

  await setCookie(COOKIE.access, await mintAccess(user, claims.sid), {
    maxAgeSeconds: TTL.accessSeconds,
  });
}

/** Live devices, newest first, for the dashboard. */
export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: "desc" },
    select: { id: true, userAgent: true, ip: true, createdAt: true, lastUsedAt: true },
    take: 20,
  });
}

/**
 * Clears out rows nobody can use any more.
 *
 * Revoked and expired sessions are kept briefly — long enough for reuse
 * detection to be meaningful — then dropped. Called opportunistically from the
 * refresh route rather than on a schedule, because this project has no cron.
 */
export async function sweepSessions() {
  const cutoff = new Date(Date.now() - 7 * 86_400_000);
  await prisma.session.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }],
    },
  });
}
