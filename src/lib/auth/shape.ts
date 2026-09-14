import type { SessionUser } from "./session";

/**
 * The only shape of a user that ever leaves the server.
 *
 * Written once, used by every route and every page, so that adding a column to
 * the table cannot quietly start publishing it. `passwordHash` is on the row
 * this is built from; it is not on the way out, and the explicit return type
 * is what keeps it that way.
 */
export type PublicUser = {
  fullName: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  avatarUrl: string | null;
  /** Whether a password is set at all — a Google-only account has none yet. */
  hasPassword: boolean;
  memberSince: string;
  lastLoginAt: string | null;
};

export function publicUser(user: SessionUser): PublicUser {
  return {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    avatarUrl: user.avatarUrl,
    hasPassword: Boolean(user.passwordHash),
    memberSince: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}
