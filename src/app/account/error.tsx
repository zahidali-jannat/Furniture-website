"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * When a page in the account fails.
 *
 * Says what happened in one sentence, offers the two things that actually
 * help — try again, or go back to the overview — and does not print the error.
 * The details go to the console for us; a visitor reading a stack trace has
 * learned nothing except that we do not tidy up after ourselves.
 */
export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[account]", error);
  }, [error]);

  return (
    <div className="max-w-lg py-8">
      <p className="eyebrow text-[0.72rem] text-charcoal/65">Something went wrong</p>

      <h1 className="display mt-5 text-[clamp(2rem,4vw,2.8rem)] leading-[0.98] text-charcoal">
        We could not
        <br />
        <em className="font-normal italic">load that.</em>
      </h1>

      <p className="mt-6 text-[1rem] leading-relaxed text-charcoal/75">
        Nothing has been lost. Try again, and if it keeps happening, call the workshop and we
        will sort it out by hand.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-7">
        <button
          type="button"
          onClick={reset}
          className="eyebrow border border-charcoal px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        >
          Try again
        </button>
        <Link
          href="/account"
          className="text-[0.9rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
        >
          Back to the overview
        </Link>
      </div>

      {error.digest && (
        <p className="mt-10 text-[0.8rem] text-charcoal/70">Reference {error.digest}</p>
      )}
    </div>
  );
}
