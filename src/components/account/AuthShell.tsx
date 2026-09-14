import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

/**
 * The frame every signed-out page sits in.
 *
 * A single photograph holds the left half and the form holds the right, which
 * is the oldest layout in print and still the one that makes a form feel like
 * part of something rather than a utility page bolted on the side. Below the
 * medium breakpoint the photograph steps aside entirely rather than shrinking
 * to a strip: a 40-pixel-tall sliver of a room is worse than none.
 *
 * The image is the only thing above the fold worth preloading, so it carries
 * `priority` and nothing else on these pages does.
 */
export default function AuthShell({
  eyebrow,
  title,
  italic,
  intro,
  children,
  footer,
  image = "/poster/shot-01-living-wide.jpg",
  caption = BRAND.tagline,
}: {
  eyebrow: string;
  title: string;
  italic?: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  image?: string;
  caption?: string;
}) {
  return (
    <main className="min-h-dvh bg-bone md:grid md:grid-cols-[46%_1fr]">
      <aside className="relative hidden md:block">
        <Image
          src={image}
          alt=""
          fill
          sizes="46vw"
          priority
          className="object-cover"
        />
        {/* Enough scrim for the wordmark and the caption, not enough to
            flatten the room behind them. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/15 to-ink/65"
        />

        <div className="relative flex h-full flex-col justify-between p-10 lg:p-14">
          <Link
            href="/"
            className="eyebrow w-fit tracking-[0.3em] text-bone/90 transition-opacity duration-700 hover:opacity-70"
            style={{ transitionTimingFunction: "var(--ease-lux)" }}
          >
            {BRAND.name}
          </Link>

          <div className="max-w-sm">
            <p className="display text-[2.1rem] leading-[1.05] text-bone">{caption}</p>
            <p className="eyebrow mt-5 text-[0.72rem] text-bone/55">
              {BRAND.established} · {BRAND.city}
            </p>
          </div>
        </div>
      </aside>

      <section className="flex min-h-dvh items-center justify-center px-6 py-16 sm:px-10 md:py-20">
        <div className="w-full max-w-[26rem]">
          <Link
            href="/"
            className="eyebrow mb-12 block w-fit tracking-[0.3em] text-charcoal transition-opacity duration-700 hover:opacity-55 md:hidden"
          >
            {BRAND.name}
          </Link>

          <p className="eyebrow text-[0.72rem] text-charcoal/65">{eyebrow}</p>

          <h1 className="display mt-5 text-[2.6rem] leading-[0.98] text-charcoal sm:text-[3rem]">
            {title}
            {italic && (
              <>
                <br />
                <em className="font-normal italic">{italic}</em>
              </>
            )}
          </h1>

          {intro && (
            <p className="mt-6 max-w-[24rem] text-[1rem] leading-relaxed text-charcoal/75">
              {intro}
            </p>
          )}

          <div className="mt-11">{children}</div>

          {footer && <div className="mt-10 border-t border-charcoal/12 pt-7">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
