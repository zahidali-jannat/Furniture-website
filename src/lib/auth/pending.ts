import "server-only";
import { COOKIE, TTL } from "./config";
import { clearCookie, readCookie, setCookie } from "./cookies";
import { signPendingTicket, verifyPendingTicket } from "./jwt";
import { currentUser } from "./session";

/**
 * The half-finished registration.
 *
 * Between "I typed my details" and "both codes are confirmed" the visitor has
 * an account row but no session, and the verification screens still have to
 * know which account they are working on. Putting the user id in the URL or in
 * the request body would let anyone send codes to anyone; instead it goes into
 * a short-lived signed cookie that only the server can read or write.
 *
 * The ticket proves nothing except which registration is in progress. It
 * cannot open the account area — middleware and every protected route look for
 * an access token, and a pending ticket fails that check by its `typ` claim.
 */

export async function startPending(user: { id: string; email: string; phone: string | null }) {
  const ticket = await signPendingTicket({
    sub: user.id,
    email: user.email,
    phone: user.phone,
  });

  await setCookie(COOKIE.pending, ticket, { maxAgeSeconds: TTL.pendingMinutes * 60 });
}

export async function clearPending() {
  await clearCookie(COOKIE.pending);
}

export type Subject = { userId: string; from: "pending" | "session" };

/**
 * Who the verification routes are acting for.
 *
 * Two ways in, because the same code path serves two moments: finishing a new
 * registration (pending ticket), and a signed-in visitor confirming a number
 * they added later from the dashboard (session). A session is preferred when
 * both are present — it is the stronger claim.
 */
export async function verificationSubject(): Promise<Subject | null> {
  const user = await currentUser();
  if (user) return { userId: user.id, from: "session" };

  const ticket = await verifyPendingTicket(await readCookie(COOKIE.pending));

  // A ticket minted for an address that no longer has a row — a registration
  // abandoned and swept, or one that never existed because the address was
  // already taken. Either way there is nothing to verify.
  if (!ticket?.sub || ticket.sub.startsWith("nobody:")) return null;

  return { userId: ticket.sub, from: "pending" };
}

/** Reads the ticket without requiring it to point at a real account. */
export async function pendingTicket() {
  return verifyPendingTicket(await readCookie(COOKIE.pending));
}
