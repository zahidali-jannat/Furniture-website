import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Chapter from "@/components/collections/Chapter";
import ChapterRail from "@/components/collections/ChapterRail";
import { RevealText, Fade } from "@/components/Reveal";
import { getChapters, getForthcoming, getRooms } from "@/lib/catalogue";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Collections — ${BRAND.wordmark}`,
  description:
    "A curated collection of furniture designed for contemporary spaces. Sofas, chairs, wardrobes and beds.",
};

/**
 * The catalogue, read as one continuous piece.
 *
 * The reader should be able to answer three questions without clicking:
 * what does this brand make, what is each type like, and where do I go next.
 * So the opening names every type in words before a single photograph, each
 * type then gets a full chapter of its own, and the only links out are the
 * deliberate ones at the end of a chapter.
 *
 * Ordering is data, not markup: chapters are the real furniture types, rooms
 * are held back as an epilogue because they are not a thing you can buy, and a
 * category with nothing photographed is named honestly rather than hidden.
 */
export default function CollectionsPage() {
  const chapters = getChapters();
  const forthcoming = getForthcoming();
  const rooms = getRooms();
  const pieces = chapters.reduce((n, c) => n + c.count, 0);

  return (
    <SiteShell>
      <ChapterRail chapters={chapters.map((c) => ({ slug: c.slug, title: c.title }))} />

      {/* ── Opening ─────────────────────────────────────────────────────── */}
      <section
        data-nav="light"
        className="relative flex min-h-[100svh] flex-col justify-between bg-bone px-5 pb-[8vh] pt-[26vh] md:px-10 md:pt-[30vh]"
      >
        <div className="mx-auto w-full max-w-[1800px]">
          <Fade>
            <p className="eyebrow mb-10 text-charcoal/45">Collections</p>
          </Fade>

          <RevealText
            lines={["A curated collection", "of furniture designed", "for contemporary spaces."]}
            className="display max-w-[20ch] text-[clamp(2.1rem,5.2vw,5rem)] leading-[1.02] text-charcoal"
            italicLast
          />
        </div>

        {/* Every type named in words, before any photography. This is the
            answer to "what does this brand actually make". */}
        <div className="mx-auto w-full max-w-[1800px]">
          <Fade delay={0.15}>
            <div className="mt-[10vh] flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-charcoal/12 pt-8">
              {chapters.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`#chapter-${c.slug}`}
                  className="group flex items-baseline gap-2 font-display text-[clamp(1.6rem,3.6vw,3rem)] leading-none text-charcoal/45 transition-colors duration-700 hover:text-charcoal"
                  style={{ transitionTimingFunction: "var(--ease-lux)" }}
                >
                  <span className="eyebrow text-charcoal/25">{String(i + 1).padStart(2, "0")}</span>
                  {c.title}
                </Link>
              ))}
              {forthcoming.map((c) => (
                <span
                  key={c.slug}
                  className="font-display text-[clamp(1.6rem,3.6vw,3rem)] leading-none text-charcoal/15"
                  title="In preparation"
                >
                  {c.title}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <p className="body-lg max-w-[46ch] text-charcoal/60">
                {pieces} pieces across {chapters.length} types, made in runs of forty.
                {forthcoming.length > 0 &&
                  ` ${forthcoming.map((c) => c.title).join(" and ")} in preparation.`}
              </p>
              <p className="eyebrow text-charcoal/35">Scroll to begin</p>
            </div>
          </Fade>
        </div>
      </section>

      {/* ── Chapters ────────────────────────────────────────────────────── */}
      <div className="bg-bone">
        {chapters.map((c, i) => (
          <Chapter key={c.slug} category={c} index={i} total={chapters.length} />
        ))}
      </div>

      {/* ── Epilogue: the pieces in place ───────────────────────────────── */}
      {rooms && (
        <section
          data-nav="light"
          id={`chapter-${rooms.slug}`}
          className="border-t border-charcoal/10 bg-bone px-5 py-[12vh] md:px-10 md:py-[16vh] lg:pr-[13.5rem]"
        >
          <div className="mx-auto max-w-[1800px]">
            <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-10">
              <div className="md:col-span-4">
                <Fade>
                  <p className="eyebrow mb-6 text-charcoal/35">Epilogue</p>
                </Fade>
                <RevealText
                  lines={[rooms.story?.headline ?? rooms.title]}
                  as="h2"
                  className="display text-[clamp(2rem,4vw,3.6rem)] leading-[1.02] text-charcoal"
                />
                <Fade delay={0.1}>
                  <p className="body-lg mt-8 max-w-[34ch] text-charcoal/60">
                    Not a range — {rooms.count} rooms photographed as they are lived
                    in, so the pieces can be read at the scale they were drawn for.
                  </p>
                  <Link
                    href={`/collections/${rooms.slug}`}
                    className="group mt-8 inline-flex items-baseline gap-4 text-charcoal"
                  >
                    <span className="font-display text-[1.1rem]">See the rooms</span>
                    <span
                      aria-hidden="true"
                      className="block h-px w-10 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16 group-hover:bg-charcoal"
                    />
                  </Link>
                </Fade>
              </div>

              <div className="md:col-span-7 md:col-start-6">
                <ul className="grid grid-cols-2 gap-4 md:gap-6">
                  {rooms.products.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link href={`/collections/${rooms.slug}/${p.id}`} className="group block">
                        <span className="flex max-h-[38svh] w-full items-center justify-center">
                          <Image
                            src={p.src}
                            alt={p.name}
                            width={p.width}
                            height={p.height}
                            sizes="(max-width: 768px) 45vw, 28vw"
                            className="block h-auto max-h-full w-auto max-w-full transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:brightness-[1.04]"
                          />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Close ───────────────────────────────────────────────────────── */}
      <section
        data-nav="light"
        className="border-t border-charcoal/10 bg-bone px-5 py-[14vh] md:px-10 md:py-[18vh]"
      >
        <div className="mx-auto max-w-[1800px] text-center">
          <RevealText
            lines={["Seen something?"]}
            as="h2"
            className="display text-[clamp(2rem,5vw,4.4rem)] text-charcoal"
          />
          <Fade delay={0.1}>
            <p className="body-lg mx-auto mt-6 max-w-[42ch] text-balance text-charcoal/60">
              The showroom is open by appointment. Bring the dimensions of the room
              and we will do the rest.
            </p>
            <Link
              href="/#contact"
              className="group mt-10 inline-flex items-baseline gap-4 text-charcoal"
            >
              <span className="font-display text-[clamp(1.2rem,2vw,1.6rem)]">Arrange a visit</span>
              <span
                aria-hidden="true"
                className="block h-px w-12 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-20 group-hover:bg-charcoal"
              />
            </Link>
          </Fade>
        </div>
      </section>
    </SiteShell>
  );
}
