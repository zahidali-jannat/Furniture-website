import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { authSecret, TTL } from "./config";

/**
 * The three signed tokens this system issues, and the rule that keeps them
 * apart.
 *
 * All three are HS256 JWTs signed with the same AUTH_SECRET, which means a
 * token of one kind is cryptographically valid as any other. That is exactly
 * the bug that turns "I am halfway through registering" into "I am signed in",
 * so every token carries a `typ` claim and every verifier refuses a token whose
 * `typ` is not the one it asked for. Issuer and audience are pinned for the
 * same reason.
 *
 * jose rather than jsonwebtoken: it runs unchanged in the edge runtime, which
 * is where middleware.ts reads the access token on every navigation.
 */

const ISSUER = "maison-noir";
const AUDIENCE = "maison-noir:web";

type Kind = "access" | "pending" | "oauth";

/** What a signed-in request knows about the visitor without touching the database. */
export type AccessClaims = {
  /** User id. */
  sub: string;
  /** Session id — the row that can revoke this token's whole device. */
  sid: string;
  /** Email verified. Protected routes refuse a token where this is false. */
  ev: boolean;
  /** Phone verified. Surfaced in the dashboard; does not gate access. */
  pv: boolean;
  name: string;
};

/** A registration that has been started but not yet proved. Not a session. */
export type PendingClaims = {
  sub: string;
  email: string;
  phone: string | null;
};

/** Carried across the round trip to Google and back. */
export type OAuthClaims = {
  state: string;
  /** PKCE code_verifier. Never leaves the server except inside this cookie. */
  verifier: string;
  nonce: string;
  /** Where to land afterwards, already validated as a local path. */
  next: string;
};

async function sign(kind: Kind, payload: JWTPayload, seconds: number): Promise<string> {
  return new SignJWT({ ...payload, typ: kind })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(authSecret());
}

async function read<T>(kind: Kind, token: string | undefined): Promise<T | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, authSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });

    // The claim that stops one kind of token standing in for another.
    if (payload.typ !== kind) return null;

    return payload as T;
  } catch {
    // Expired, tampered with, or signed by a different secret. All the same
    // answer to the caller: no.
    return null;
  }
}

export function signAccessToken(claims: AccessClaims) {
  return sign("access", { ...claims }, TTL.accessSeconds);
}

export function verifyAccessToken(token: string | undefined) {
  return read<AccessClaims & JWTPayload>("access", token);
}

export function signPendingTicket(claims: PendingClaims) {
  return sign("pending", { ...claims }, TTL.pendingMinutes * 60);
}

export function verifyPendingTicket(token: string | undefined) {
  return read<PendingClaims & JWTPayload>("pending", token);
}

export function signOAuthState(claims: OAuthClaims) {
  return sign("oauth", { ...claims }, TTL.oauthMinutes * 60);
}

export function verifyOAuthState(token: string | undefined) {
  return read<OAuthClaims & JWTPayload>("oauth", token);
}
