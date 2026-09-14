import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/email/mailer";
import { welcome } from "@/lib/email/auth-emails";
import { appOrigin, googleRedirectUri } from "./config";
import type { SessionUser } from "./session";

/**
 * Sign in with Google, done the way Google asks for it.
 *
 * Authorization Code flow with PKCE. The visitor types their password on
 * accounts.google.com and nowhere else; this site never sees it, never asks
 * for it, and would not know what to do with it. What comes back is an
 * authorization code, which is worthless without the client secret and the
 * PKCE verifier — the secret lives in the server environment, the verifier in
 * an httpOnly cookie, and neither has ever been in a browser's reach.
 *
 * The identity itself is taken from the id_token, and the id_token is verified
 * against Google's published keys rather than trusted because it arrived over
 * HTTPS: signature, issuer, audience and the nonce we sent. An unverified
 * `email` claim is refused outright — accepting one would let anybody who can
 * make a Google account with somebody else's address walk into that person's
 * account here.
 */

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

// Cached across requests by jose, so Google's key set is fetched once and
// re-fetched only when a token is signed with a key it has not seen.
const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleIdentity = {
  sub: string;
  email: string;
  name: string;
  picture: string | null;
};

export function authorizeUrl(opts: { state: string; nonce: string; challenge: string }) {
  const url = new URL(AUTH_ENDPOINT);

  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  // Only what the dashboard actually shows: a name, an address, a picture.
  // Nothing about contacts, calendars or anything else Google would hand over
  // for the asking.
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", opts.state);
  url.searchParams.set("nonce", opts.nonce);
  url.searchParams.set("code_challenge", opts.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // No refresh token is requested: this site does not act on Google's behalf
  // afterwards, it only needs to know who signed in, once.
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

/** Exchanges the code and returns the identity Google will vouch for. */
export async function exchangeCode(code: string, verifier: string, nonce: string) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`token exchange failed (${res.status}): ${detail.slice(0, 300)}`);
  }

  const tokens = (await res.json()) as { id_token?: string };
  if (!tokens.id_token) throw new Error("token response carried no id_token");

  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: GOOGLE_ISSUERS,
    audience: process.env.GOOGLE_CLIENT_ID!,
  });

  // Binds this token to the redirect we started. Without it, a token minted
  // for another session of ours could be replayed into this one.
  if (payload.nonce !== nonce) throw new Error("nonce mismatch");

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;

  if (!email || payload.email_verified !== true) {
    return null;
  }

  return {
    sub: String(payload.sub),
    email,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name : email.split("@")[0],
    picture: typeof payload.picture === "string" ? payload.picture : null,
  } satisfies GoogleIdentity;
}

const USER_FIELDS = {
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

/**
 * Finds, links or creates the account behind a Google identity.
 *
 * Three cases, and getting the middle one wrong is how sites end up with two
 * accounts for one person:
 *
 *   1. We have seen this Google id before — that is the account, whatever the
 *      address says now. People change their Gmail address; `sub` does not.
 *   2. We have not, but the verified address already has an account here. It
 *      is the same person, so Google is linked to the existing account rather
 *      than a second one being made. Google has proved the address, so an
 *      account still waiting on its email verification is confirmed by this.
 *   3. Neither — a new account, already email-verified, with no password and
 *      no phone yet. The dashboard asks for the phone; nothing is invented.
 */
export async function resolveGoogleUser(
  identity: GoogleIdentity
): Promise<{ user: SessionUser; created: boolean; linked: boolean }> {
  const existingLink = await prisma.authProvider.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: identity.sub } },
    include: { user: { select: USER_FIELDS } },
  });

  if (existingLink) {
    const user = await prisma.user.update({
      where: { id: existingLink.userId },
      data: { avatarUrl: identity.picture ?? existingLink.user.avatarUrl },
      select: USER_FIELDS,
    });
    return { user, created: false, linked: false };
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: identity.email },
    select: USER_FIELDS,
  });

  if (byEmail) {
    const [, user] = await prisma.$transaction([
      prisma.authProvider.create({
        data: {
          userId: byEmail.id,
          provider: "google",
          providerAccountId: identity.sub,
          email: identity.email,
        },
      }),
      prisma.user.update({
        where: { id: byEmail.id },
        data: {
          emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          avatarUrl: byEmail.avatarUrl ?? identity.picture,
          // A linked account whose phone is already proven is fully active.
          status: byEmail.phoneVerifiedAt ? "ACTIVE" : byEmail.status,
        },
        select: USER_FIELDS,
      }),
    ]);

    return { user, created: false, linked: true };
  }

  const user = await prisma.user.create({
    data: {
      fullName: identity.name,
      email: identity.email,
      emailVerifiedAt: new Date(),
      avatarUrl: identity.picture,
      // PENDING until a phone is added and proven; email alone is enough to
      // use the account, so nothing is blocked by this.
      status: "PENDING",
      providers: {
        create: { provider: "google", providerAccountId: identity.sub, email: identity.email },
      },
    },
    select: USER_FIELDS,
  });

  const mail = welcome({ name: user.fullName, link: `${appOrigin()}/account` });
  sendMail({ to: user.email, subject: mail.subject, html: mail.html, text: mail.text }).catch(
    (err) => console.error("[auth] welcome email failed", err)
  );

  return { user, created: true, linked: false };
}
