/**
 * The dashboard's furniture: a section, a labelled row, a status mark and an
 * empty state.
 *
 * Hairlines and space do the work that borders and shadows do elsewhere. There
 * is one accent colour in the whole account area — the olive dot that means
 * "confirmed" — and it is used nowhere else, so it means something when it
 * appears.
 */

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
          <h2 className="eyebrow text-[0.63rem] text-charcoal/45">{title}</h2>
          {description && (
            <p className="mt-3 max-w-xl text-[0.85rem] leading-relaxed text-charcoal/50">
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
      <dt className="eyebrow text-[0.6rem] text-charcoal/35">{label}</dt>
      <dd className="flex items-center gap-5 text-[0.9rem] text-charcoal/80">
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
        "inline-flex items-center gap-2 text-[0.78rem]",
        yes ? "text-olive" : "text-charcoal/45",
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
      <span className="eyebrow mt-3 block text-[0.58rem] text-charcoal/35">{label}</span>
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
      <p className="text-[0.88rem] text-charcoal/45">{line}</p>
      {cta && <div className="mt-6 flex justify-center">{cta}</div>}
    </div>
  );
}
