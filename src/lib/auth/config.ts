/**
 * Every tunable number and secret the account system reads, in one file.
 *
 * Nothing here is imported by a client component, and nothing here is inlined
 * into the bundle: none of these names begin with NEXT_PUBLIC_, so Next will
 * not expose them even by accident. Whether Google sign-in is *offered* is a
 * separate, deliberately public flag — see `googleConfigured()` and the
 * /api/auth/providers route.
 */

export const COOKIE = {
  /** Short-lived JWT proving who is signed in. */
  access: "mn_session",
  /** Opaque, rotated on every use, matched against a digest in the database. */
  refresh: "mn_refresh",
  /** Carries a half-finished registration between the verification steps. */
  pending: "mn_pending",
  /** OAuth state + PKCE verifier, alive only for the length of the round trip. */
  oauth: "mn_oauth",
  /**
   * The one cookie the browser can read, and it holds a single "1".
   *
   * It says a session exists and nothing else — no id, no name, no token — so
   * that a statically generated product page can decide whether asking the
   * server about saved pieces is worth a request. Forging it gains nothing:
   * every route still checks the real token.
   */
  member: "mn_member",
} as const;

export const TTL = {
  /** Access tokens are cheap to mint and are refreshed silently. */
  accessSeconds: 15 * 60,
  /** How long a signed-in device stays signed in without being used. */
  refreshDays: 30,
  /** A registration that is never finished expires rather than lingering. */
  pendingMinutes: 45,
  emailTokenMinutes: 30,
  phoneOtpMinutes: 10,
  passwordResetMinutes: 60,
  oauthMinutes: 10,
} as const;

export const LIMITS = {
  /** Wrong codes allowed against a single email token or phone OTP. */
  otpAttempts: 5,
  /** Seconds a visitor must wait before asking for another code. */
  resendCooldownSeconds: 60,
  /** Failed passwords before the account itself is held shut. */
  loginFailures: 8,
  loginLockMinutes: 15,
  bcryptRounds: 12,
  /** Codes are six digits, so they get a real hash but a cheaper one. */
  otpBcryptRounds: 10,
  passwordMin: 10,
  passwordMax: 200,
} as const;

/** Fails loudly at boot rather than quietly signing tokens with "undefined". */
export function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with:\n" +
        "  node -e \"console.log(require('crypto').randomBytes(32).toString('base64url'))\"\n" +
        "and put it in .env.local — see .env.example."
    );
  }

  return new TextEncoder().encode(secret);
}

/** Absolute origin of this deployment; every callback URL is built from it. */
export function appOrigin(): string {
  const raw = process.env.APP_ORIGIN || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(): string {
  // Must match a redirect URI registered on the Google credential exactly,
  // including scheme and port, or Google answers redirect_uri_mismatch.
  return process.env.GOOGLE_REDIRECT_URI || `${appOrigin()}/api/auth/google/callback`;
}

/** True in any deployment served over TLS — drives the cookie Secure flag. */
export function secureCookies(): boolean {
  return process.env.NODE_ENV === "production" || appOrigin().startsWith("https://");
}
