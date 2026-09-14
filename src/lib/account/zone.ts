/**
 * Appointment times are showroom times.
 *
 * Three clocks could reasonably be involved in booking a visit: the visitor's,
 * the server's, and the showroom's. Only one of them matters — somebody has to
 * walk through a door in Copenhagen at a particular moment — so a time typed
 * into the form is read as Copenhagen time, stored as the instant that
 * represents, and printed back in Copenhagen time. What you type is what the
 * clock on the showroom wall will say.
 *
 * Left to itself, a `datetime-local` input gives a naive string and `new Date()`
 * reads it in whatever zone the server happens to be in. That is how "three in
 * the afternoon" becomes half past eleven on a laptop in another country — and
 * it is exactly what these functions exist to prevent.
 */

export const SHOWROOM_ZONE = "Europe/Copenhagen";

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHOWROOM_ZONE,
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The wall-clock reading of an instant, in the showroom's zone. */
export function showroomParts(date: Date) {
  const parts = Object.fromEntries(
    PARTS.formatToParts(date).map((part) => [part.type, part.value])
  ) as Record<string, string>;

  return {
    /** 0 = Sunday, matching Date#getDay. */
    day: DAYS.indexOf(parts.weekday),
    year: Number(parts.year),
    month: Number(parts.month),
    date: Number(parts.day),
    // "24" appears at midnight in some environments; both mean the same hour.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
  };
}

/**
 * Reads "2026-10-03T15:00" as three in the afternoon in Copenhagen.
 *
 * Works by guessing that the naive string is UTC, measuring how far that guess
 * lands from the showroom's clock, and correcting by the difference. The offset
 * is taken at the guessed instant rather than today, so a booking on the far
 * side of a daylight-saving change is still the hour that was asked for.
 */
export function fromShowroomLocal(naive: string): Date {
  const guess = new Date(`${naive.length === 16 ? `${naive}:00` : naive}Z`);
  if (Number.isNaN(guess.getTime())) return guess;

  const seen = showroomParts(guess);
  const asShowroom = Date.UTC(seen.year, seen.month - 1, seen.date, seen.hour, seen.minute);

  return new Date(guess.getTime() + (guess.getTime() - asShowroom));
}

/** The value a datetime-local input wants, written in showroom time. */
export function toShowroomInput(date: Date): string {
  const p = showroomParts(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.date)}T${pad(p.hour)}:${pad(p.minute)}`;
}
