import "server-only";
import { randomInt } from "node:crypto";

/**
 * The number somebody reads out on the telephone.
 *
 *   MN-2609-4KTQ
 *
 * The month is in it so the studio can tell at a glance how old a thing is,
 * and the tail is four random characters rather than a counter — a sequence
 * would let anyone work out how many enquiries the workshop receives, and let
 * them guess their neighbour's.
 *
 * I, O, 0 and 1 are left out of the alphabet. Every one of these is going to be
 * read aloud or copied off a screen at some point, and those four are where
 * that goes wrong.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeReference(prefix = "MN"): string {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");

  let tail = "";
  for (let i = 0; i < 4; i += 1) tail += ALPHABET[randomInt(0, ALPHABET.length)];

  return `${prefix}-${yy}${mm}-${tail}`;
}

/**
 * Runs a create that needs a unique reference, retrying on the one-in-a-million
 * collision rather than handing the visitor an error they can do nothing about.
 */
export async function withReference<T>(
  create: (reference: string) => Promise<T>,
  attempts = 5
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await create(makeReference());
    } catch (err) {
      // P2002 is a unique-constraint collision; anything else is a real
      // failure and retrying it would only make the same mess twice.
      const code = (err as { code?: string })?.code;
      if (code !== "P2002") throw err;
      lastError = err;
    }
  }

  throw lastError;
}

/** Normalises what somebody typed or pasted into a reference. */
export function tidyReference(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
