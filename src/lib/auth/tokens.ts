import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { LIMITS } from "./config";

/**
 * The two kinds of secret this system hands out, and why they are hashed
 * differently.
 *
 *   Opaque tokens — refresh tokens, verification links, reset links. 32 random
 *   bytes. There is nothing to guess, so SHA-256 is right: a digest to compare
 *   against, fast enough to do on every request.
 *
 *   Codes — the six digits typed from an email or a text message. A million
 *   possibilities is nothing to a GPU, so these get bcrypt, and the number of
 *   guesses is capped in the database row besides.
 *
 * Nothing here ever returns a stored secret. The plaintext exists only in the
 * message sent to the person and in the cookie handed to their browser.
 */

/** 32 bytes of CSPRNG output, URL-safe. */
export function opaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function digest(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two hex digests. */
export function digestsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length || left.length === 0) return false;
  return timingSafeEqual(left, right);
}

/**
 * A six-digit code.
 *
 * randomInt, not Math.random: this is a credential. Leading zeros are kept,
 * so "004521" is a legitimate code and the string length is always six.
 */
export function numericCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function hashCode(code: string): Promise<string> {
  return bcrypt.hash(code, LIMITS.otpBcryptRounds);
}

export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86_400_000);
}

/** Formats a code as "045 210" for reading aloud, without changing its value. */
export function spacedCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
