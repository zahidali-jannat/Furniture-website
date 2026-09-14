"use client";

/**
 * The two buttons the account pages use, and one link that looks like neither.
 *
 * The fill that rises from the bottom edge on hover is the same gesture as the
 * enquiry form on the homepage — it is the site's one button idiom, and
 * repeating it is what keeps the account area feeling like the same building.
 */

export function PrimaryButton({
  children,
  busy = false,
  busyLabel = "Working…",
  ...rest
}: { children: React.ReactNode; busy?: boolean; busyLabel?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={busy || rest.disabled}
      className={[
        "group relative w-full overflow-hidden border border-charcoal bg-charcoal px-8 py-4",
        "eyebrow text-[0.76rem] text-bone transition-colors duration-700",
        "hover:text-charcoal disabled:cursor-wait disabled:opacity-70",
        rest.className ?? "",
      ].join(" ")}
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-disabled:scale-y-0"
      />
      <span className="relative">{busy ? busyLabel : children}</span>
    </button>
  );
}

export function QuietButton({
  children,
  busy = false,
  ...rest
}: { children: React.ReactNode; busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      disabled={busy || rest.disabled}
      className={[
        "group relative overflow-hidden border border-charcoal/25 px-7 py-3.5",
        "eyebrow text-[0.74rem] text-charcoal transition-colors duration-700",
        "hover:border-charcoal disabled:opacity-50",
        rest.className ?? "",
      ].join(" ")}
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      <span className="relative">{busy ? "Working…" : children}</span>
    </button>
  );
}

/**
 * Google's button, to Google's rules: their mark, unaltered, on a surface of
 * ours. The visitor's password is typed on accounts.google.com and nowhere
 * else — this is a link out, not a form.
 */
export function GoogleButton({ href, label = "Continue with Google" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      className="group flex w-full items-center justify-center gap-3 border border-charcoal/20 px-8 py-4 transition-colors duration-700 hover:border-charcoal/45 hover:bg-charcoal/[0.03]"
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      <GoogleMark />
      <span className="eyebrow text-[0.76rem] text-charcoal">{label}</span>
    </a>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** "or" with a rule either side. */
export function Divider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-charcoal/12" />
      <span className="eyebrow text-[0.72rem] text-charcoal/65">{label}</span>
      <span className="h-px flex-1 bg-charcoal/12" />
    </div>
  );
}
