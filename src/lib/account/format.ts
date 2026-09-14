/**
 * Dates, written the way the brand writes them.
 *
 * "3 October 2026", not "03/10/26" — which reads as March in half the world —
 * and never a relative "2 days ago", which forces somebody to do arithmetic to
 * find out when their appointment actually is.
 *
 * Everything is rendered in one fixed zone. The showroom is in Copenhagen, the
 * appointments happen there, and a time that silently shifts to the reader's
 * own zone is how people arrive an hour late. It also keeps the server and the
 * browser printing the same string, which is what stops React complaining
 * about a mismatch it cannot see the cause of.
 */

import { SHOWROOM_ZONE, toShowroomInput } from "./zone";

const ZONE = SHOWROOM_ZONE;

export function longDate(date: Date | string, withTime = false): string {
  const value = typeof date === "string" ? new Date(date) : date;

  return value.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
    timeZone: ZONE,
  });
}

export function shortDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONE,
  });
}

/** "Tuesday" — used where the day of the week is the useful part. */
export function weekday(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-GB", { weekday: "long", timeZone: ZONE });
}

/** The value a datetime-local input wants: "2026-10-03T15:30". */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * The soonest time the consultation form will offer, as a value a
 * datetime-local input understands.
 *
 * Read once per request rather than in the component body: the clock is the
 * one thing on these pages that is not a pure function of the data, and
 * keeping it behind a named call says so.
 */
export async function earliestSlot(hoursAhead = 21): Promise<string> {
  return toShowroomInput(new Date(Date.now() + hoursAhead * 60 * 60 * 1000));
}
