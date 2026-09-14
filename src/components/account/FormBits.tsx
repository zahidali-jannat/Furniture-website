"use client";

/**
 * Two small pieces every account form uses.
 */

/**
 * The error line.
 *
 * `aria-live` on a row that is always in the document, rather than a node that
 * appears: a live region added to the page at the moment it has something to
 * say is frequently not announced at all.
 */
export function FormNotice({
  error,
  success,
  children,
}: {
  error?: string | null;
  success?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <div aria-live="polite" className="min-h-[1.2rem]">
      {error && <p className="text-[0.88rem] leading-snug text-rust">{error}</p>}
      {success && !error && (
        <p className="text-[0.88rem] leading-snug text-moss">{success}</p>
      )}
      {children}
    </div>
  );
}

/**
 * The honeypot.
 *
 * Positioned off-screen rather than hidden with `display:none`, which the
 * better-written bots know to skip. Nothing a person using a keyboard or a
 * screen reader can reach: negative tab index, aria-hidden, no label.
 */
export function Honeypot() {
  return (
    <input
      type="text"
      name="company"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
    />
  );
}
