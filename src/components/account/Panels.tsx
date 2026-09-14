/**
 * The dashboard's furniture: a section, a labelled row, a status mark and an
 * empty state.
 *
 * Hairlines and space do the work that borders and shadows do elsewhere. There
 * is one accent colour in the whole account area — the olive dot that means
 * "confirmed" — and it is used nowhere else, so it means something when it
 * appears.
 */

/**
 * The top of every page in the portal.
 *
 * One eyebrow, one serif line broken across two, one sentence of orientation.
 * Repeated exactly so that moving between sections feels like turning a page
 * rather than arriving somewhere new.
 */
export function PageHeading({
  eyebrow,
  title,
  italic,
  intro,
  aside,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  intro?: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 pb-12">
      <div>
        <p className="eyebrow text-[0.72rem] text-charcoal/65">{eyebrow}</p>
        <h1 className="display mt-5 text-[clamp(2.1rem,4.4vw,3.2rem)] leading-[0.98] text-charcoal">
          {title}
          {italic && (
            <>
              <br />
              <em className="font-normal italic">{italic}</em>
            </>
          )}
        </h1>
        {intro && (
          <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-charcoal/75">{intro}</p>
        )}
      </div>
      {aside}
    </header>
  );
}

/**
 * A status, set as small caps against a dot.
 *
 * Three tones and no more: olive for something settled, clay for something
 * waiting on a person, and grey for something closed. A row of coloured badges
 * is how this page would start looking like a courier's tracking screen.
 */
export function StatusTag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "settled" | "waiting" | "neutral";
}) {
  const dot =
    tone === "settled" ? "bg-olive" : tone === "waiting" ? "bg-clay" : "bg-charcoal/25";

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap eyebrow text-[0.7rem] text-charcoal/75">
      <span aria-hidden="true" className={`h-1 w-1 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/** A short label above a value — used in rows of two or three facts. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow text-[0.68rem] text-charcoal/65">{label}</p>
      <p className="mt-2 text-[0.96rem] leading-relaxed text-charcoal/80">{children}</p>
    </div>
  );
}

export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-charcoal/12 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="eyebrow text-[0.74rem] text-charcoal/70">{title}</h2>
          {description && (
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-charcoal/75">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>

      <div className="mt-8">{children}</div>
    </section>
  );
}

/** A label on the left, a value on the right, a hairline between rows. */
export function DetailRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-charcoal/8 py-4 last:border-b-0">
      <dt className="eyebrow text-[0.72rem] text-charcoal/65">{label}</dt>
      <dd className="flex items-center gap-5 text-[1rem] text-charcoal/80">
        {value}
        {action}
      </dd>
    </div>
  );
}

export function Verified({ yes, label }: { yes: boolean; label?: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 text-[0.88rem]",
        yes ? "text-moss" : "text-charcoal/70",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={["h-1 w-1 rounded-full", yes ? "bg-olive" : "bg-clay"].join(" ")}
      />
      {label ?? (yes ? "Confirmed" : "Not confirmed")}
    </span>
  );
}

/** A number and what it counts. Three of these, never a chart. */
export function Figure({ value, label, href }: { value: number | string; label: string; href?: string }) {
  const content = (
    <>
      <span className="display block text-[2.4rem] leading-none text-charcoal">{value}</span>
      <span className="eyebrow mt-3 block text-[0.7rem] text-charcoal/65">{label}</span>
    </>
  );

  if (!href) return <div className="py-1">{content}</div>;

  return (
    <a
      href={href}
      className="block py-1 transition-opacity duration-500 hover:opacity-60"
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      {content}
    </a>
  );
}

export function Empty({ line, cta }: { line: string; cta?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-charcoal/15 px-8 py-14 text-center">
      <p className="text-[0.96rem] text-charcoal/70">{line}</p>
      {cta && <div className="mt-6 flex justify-center">{cta}</div>}
    </div>
  );
}
