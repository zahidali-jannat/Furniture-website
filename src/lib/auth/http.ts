import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { rateLimit, sweep } from "@/lib/rate-limit";
import { clientIp } from "./session";
import { fieldErrors } from "./validation";

/**
 * The shape every account route answers in, and the rules about what it is
 * allowed to say.
 *
 * A failure gives the visitor one sentence they can act on and nothing else.
 * No stack traces, no database text, no "unknown email" versus "wrong
 * password" — the difference between those two is a list of who holds an
 * account here. Detail goes to the server log, where it belongs.
 */

export type ApiError = {
  error: string;
  fields?: Record<string, string>;
  /** Machine-readable hint the forms branch on — never a reason to the visitor. */
  code?: string;
};

export function ok<T extends object>(data: T = {} as T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, { status: 200, ...init });
}

export function fail(status: number, error: string, extra: Omit<ApiError, "error"> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export function invalid(error: z.ZodError, message = "Please check the form.") {
  return fail(422, message, { fields: fieldErrors(error) });
}

/** Logged, then answered with something that gives nothing away. */
export function serverError(where: string, err: unknown) {
  console.error(`[auth] ${where}`, err);
  return fail(500, "Something went wrong on our side. Please try again.");
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/**
 * Fixed-window limiting, keyed however the caller asks.
 *
 * Login and password reset are keyed by address *and* by IP: by address so one
 * account cannot be ground down from a botnet, by IP so one machine cannot
 * work through a list of addresses. Either key tripping is enough to refuse.
 */
export function guard(
  req: Request,
  buckets: { key: string; limit: number; windowMs: number }[]
): NextResponse | null {
  sweep();
  const ip = clientIp(req);

  for (const bucket of buckets) {
    // Requests with no usable address share one bucket rather than bypassing
    // the limiter — which is the right way round for something anonymous.
    const result = rateLimit(`${bucket.key}:${ip}`, bucket.limit, bucket.windowMs);
    if (!result.ok) {
      return fail(429, "Too many attempts. Wait a moment and try again.", {
        code: "rate_limited",
      }) as NextResponse;
    }
  }

  return null;
}

/** Limits a single named subject — an address, a phone, a user id. */
export function guardSubject(
  subject: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  sweep();
  const result = rateLimit(subject, limit, windowMs);
  if (result.ok) return null;
  return fail(429, "Too many attempts. Wait a moment and try again.", {
    code: "rate_limited",
  }) as NextResponse;
}

/**
 * A response nothing is allowed to cache.
 *
 * Account JSON behind a shared cache is somebody else's name on your screen.
 * Applied to every route under /api/auth and /api/account.
 */
export function noStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.headers.set("Pragma", "no-cache");
  return res;
}

/** True when the honeypot field was filled — a bot, answered as if it worked. */
export function trippedHoneypot(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}
