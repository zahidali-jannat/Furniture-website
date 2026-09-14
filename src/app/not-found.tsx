import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { getChapters } from "@/lib/catalogue";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 answers with the right status code whatever this says, but there is
  // no reason for it to sit in an index.
  robots: { index: false, follow: true },
};

/**
 * The page that is reached by a typo, an old link, or a piece that has left the
 * catalogue.
 *
 * It is a way back rather than an apology: the furniture types, in words, in
 * the same type as everywhere else. A dead end on a site whose whole structure
 * is a hierarchy would be the one place a visitor cannot navigate from.
 */
export default function NotFound() {
  const chapters = getChapters();

  return (
    <SiteShell>
      <section
        data-nav="light"
        className="flex min-h-[100svh] w-full flex-col justify-center bg-bone px-5 py-[18vh] md:px-10"
      >
        <div className="mx-auto w-full max-w-[1800px]">
          <p className="eyebrow text-charcoal/45">404</p>

          <h1 className="display mt-8 max-w-[16ch] text-[clamp(2.6rem,8vw,7rem)] leading-[0.98] text-charcoal">
            This page has
            <br />
            <em className="font-normal italic">left the room.</em>
          </h1>

          <p className="body-lg mt-8 max-w-[46ch] text-charcoal/65">
            The address does not match anything we make. The collection is below, and everything in
            it is where it has always been.
          </p>

          <nav aria-label="Furniture types" className="mt-14 border-t border-charcoal/12 pt-8">
            <ul className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              {chapters.map((chapter, index) => (
                <li key={chapter.slug}>
                  <Link
                    href={`/collections/${chapter.slug}`}
                    className="group flex items-baseline gap-2 font-display text-[clamp(1.5rem,3.2vw,2.6rem)] leading-none text-charcoal/50 transition-colors duration-700 hover:text-charcoal"
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  >
                    <span className="eyebrow text-charcoal/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {chapter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-4">
            <Link
              href="/collections"
              className="eyebrow border border-charcoal px-8 py-4 text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
              style={{ transitionTimingFunction: "var(--ease-lux)" }}
            >
              The whole collection
            </Link>
            <Link
              href="/contact"
              className="text-[0.95rem] text-charcoal/60 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              Or ask us where it went
            </Link>
          </div>

          <p className="eyebrow mt-16 text-charcoal/30">
            {BRAND.established} · {BRAND.city}
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
