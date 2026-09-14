import "server-only";
import bcrypt from "bcryptjs";
import { LIMITS } from "./config";

/**
 * Passwords, hashed with bcrypt.
 *
 * bcryptjs rather than argon2 or the native bcrypt binding: both of those are
 * compiled add-ons, and this project is developed on Windows without a build
 * toolchain. bcrypt at cost 12 is a sound choice — it is deliberately slow,
 * salted per hash, and has no published practical break. If this ever moves to
 * a platform where argon2id builds cleanly, `hashPassword` is the only place
 * that needs to change: `verifyPassword` can keep reading old bcrypt digests
 * by looking at the prefix.
 */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, LIMITS.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burns roughly the same time as a real comparison.
 *
 * Without this, "no such account" returns in a millisecond and "wrong
 * password" takes a hundred, which turns the login form into an oracle for
 * which addresses are registered. Called on the miss path so both answers cost
 * the same.
 */
export async function fakeVerifyDelay(): Promise<void> {
  // A real cost-12 digest of the string below, so the comparison does the full
  // amount of work. A malformed hash would return false instantly and defeat
  // the whole point.
  await bcrypt.compare(
    "not-a-real-password",
    "$2b$12$ArEvYNKZiY6eN4ay6lRKNOBscjlBj3i/CZplxNra6AGctmiPExS.C"
  );
}

/**
 * Password rules, as prose the visitor can act on.
 *
 * Length carries the weight rather than a character-class puzzle: ten
 * characters minimum, and a short list of the passwords that actually get
 * tried first. Composition rules push people towards "Passw0rd!", which is
 * worse than a long phrase.
 */
const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwertyuiop", "letmein123", "iloveyou1", "welcome123", "admin12345",
  "maisonnoir", "furniture1", "changeme123",
]);

export function passwordProblem(password: string, context: string[] = []): string | null {
  if (password.length < LIMITS.passwordMin)
    return `Use at least ${LIMITS.passwordMin} characters.`;
  if (password.length > LIMITS.passwordMax)
    return "That is longer than we can store. Trim it a little.";
  if (COMMON.has(password.toLowerCase()))
    return "That password is one of the first ones guessed. Choose another.";
  if (/^(.)\1+$/.test(password))
    return "One repeated character is not a password.";

  // Your own name or address is the second thing an attacker tries.
  const lowered = password.toLowerCase();
  for (const hint of context) {
    const h = hint.toLowerCase().trim();
    if (h.length >= 4 && lowered.includes(h))
      return "Leave your name and address out of your password.";
  }

  return null;
}
