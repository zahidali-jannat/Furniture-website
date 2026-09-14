import "server-only";
import { cookies } from "next/headers";
import { COOKIE, TTL, secureCookies } from "./config";

/**
 * Every cookie this system sets is httpOnly.
 *
 * No token is ever readable from JavaScript, which is what makes a cross-site
 * scripting bug on the marketing pages stop short of being an account
 * takeover. SameSite is Lax rather than Strict so that following a verification
 * link out of an email arrives signed in; nothing here is a state-changing GET,
 * and every mutating route is a POST, so Lax is not a CSRF hole.
 */

type SetOptions = {
  maxAgeSeconds: number;
  /** Narrower than "/" for cookies only one route needs to see. */
  path?: string;
};

const base = () => ({
  httpOnly: true,
  secure: secureCookies(),
  sameSite: "lax" as const,
  path: "/",
});

export async function setCookie(name: string, value: string, opts: SetOptions) {
  const jar = await cookies();
  jar.set(name, value, {
    ...base(),
    path: opts.path ?? "/",
    maxAge: opts.maxAgeSeconds,
  });
}

export async function clearCookie(name: string, path = "/") {
  const jar = await cookies();
  // maxAge 0 rather than delete(): deleting omits the attributes, and a cookie
  // set with Secure on a path is only overwritten by one that matches.
  jar.set(name, "", { ...base(), path, maxAge: 0 });
}

export async function readCookie(name: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(name)?.value;
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  await setCookie(COOKIE.access, accessToken, { maxAgeSeconds: TTL.accessSeconds });
  await setCookie(COOKIE.refresh, refreshToken, {
    maxAgeSeconds: TTL.refreshDays * 86_400,
  });

  // Readable by the page, deliberately. It carries "1" and nothing else — see
  // COOKIE.member — so that a cached, statically rendered page can tell whether
  // there is any point asking the server about this visitor's saved pieces.
  const jar = await cookies();
  jar.set(COOKIE.member, "1", {
    httpOnly: false,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: TTL.refreshDays * 86_400,
  });
}

export async function clearAuthCookies() {
  await clearCookie(COOKIE.access);
  await clearCookie(COOKIE.refresh);
  await clearCookie(COOKIE.pending);

  const jar = await cookies();
  jar.set(COOKIE.member, "", {
    httpOnly: false,
    secure: secureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
