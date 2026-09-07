import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/catalogue";
import { groupOf } from "@/lib/catalogue";
import PlateImage from "@/components/media/PlateImage";
import { RevealText, Fade } from "@/components/Reveal";

/**
 * One furniture type, given a full screen of its own.
 *
 * Not a card. The naming column stays put while the photograph travels past
 * it, so the reader always knows which type they are looking at without a
 * label following them around. Chapters alternate sides so the eye has to move.
 *
 * Everything here is a real heading and a real link. With animation disabled
 * the chapter still reads top to bottom: number, name, claim, materials, a few
 * pieces, a way in.
 */
export default function Chapter({
  category: c,
  index,
  total,
}: {
  category: Category;
  index: number;
  total: number;
}) {
  const n = String(index + 1).padStart(2, "0");
  // "Explore all 1 beds" — titles are plural, so a single piece needs its own
  // phrasing rather than a count in front of a plural noun.
  const singular = c.title.replace(/s$/i, "").toLowerCase();
  const parent = groupOf(c.slug);
  const cta = c.count === 1 ? `Explore the ${singular}` : `Explore all ${c.count} ${c.title.toLowerCase()}`;
  const flip = index % 2 === 1;
  const preview = c.products.slice(0, 4);

  return (
    <section
      id={`chapter-${c.slug}`}
      data-chapter={c.slug}
      data-nav="light"
      className="relative scroll-mt-24 border-t border-charcoal/10 py-[12vh] md:py-[16vh]"
      aria-labelledby={`chapter-${c.slug}-title`}
    >
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-y-12 px-5 md:grid-cols-12 md:gap-x-10 md:px-10 lg:pr-[13.5rem]">
        {/* Naming column */}
        <div
          className={[
            // No `self-start`: it would collapse the cell to its content and
            // leave the sticky column below with no travel, so the name would
            // scroll away from its own photograph.
            "md:col-span-4",
            flip ? "md:col-start-9 md:order-2" : "md:col-start-1",
          ].join(" ")}
        >
          <div className="md:sticky md:top-[20vh]">
            <Fade>
              <p className="eyebrow mb-6 flex flex-wrap items-center gap-x-3 text-charcoal/35">
                <span>
                  {n} <span className="mx-1 text-charcoal/20">/</span> {String(total).padStart(2, "0")}
                </span>
                {/* The group makes the middle level of the hierarchy visible
                    while reading, not only once you have clicked into a type. */}
                {parent && (
                  <>
                    <span aria-hidden="true" className="text-charcoal/20">—</span>
                    <Link
                      href={`/collections/${parent.slug}`}
                      className="transition-colors duration-500 hover:text-charcoal"
                    >
                      {parent.title}
                    </Link>
                  </>
                )}
              </p>
            </Fade>

            <RevealText
              lines={[c.title]}
              as="h2"
              className="display text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.95] text-charcoal"
            />

            {c.story && (
              <Fade delay={0.05}>
                <p className="mt-6 font-display text-[clamp(1.25rem,2vw,1.9rem)] italic leading-snug text-charcoal/75">
                  {c.story.headline}
                </p>
              </Fade>
            )}

            <Fade delay={0.1}>
              <dl className="mt-10 space-y-6 border-t border-charcoal/12 pt-8">
                {c.story?.materials && (
                  <div>
                    <dt className="eyebrow mb-2 text-charcoal/35">Material</dt>
                    <dd className="max-w-[34ch] text-[0.92rem] leading-relaxed text-charcoal/65">
                      {c.story.materials}
                    </dd>
                  </div>
                )}
                {c.story?.space && (
                  <div>
                    <dt className="eyebrow mb-2 text-charcoal/35">Intended for</dt>
                    <dd className="max-w-[34ch] text-[0.92rem] leading-relaxed text-charcoal/65">
                      {c.story.space}
                    </dd>
                  </div>
                )}
              </dl>
            </Fade>

            <Fade delay={0.15}>
              <Link
                href={`/collections/${c.slug}`}
                className="group mt-10 inline-flex items-baseline gap-4 text-charcoal"
              >
                <span className="font-display text-[clamp(1.05rem,1.5vw,1.3rem)]">{cta}</span>
                <span
                  aria-hidden="true"
                  className="block h-px w-10 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16 group-hover:bg-charcoal"
                />
              </Link>
            </Fade>
          </div>
        </div>

        {/* The photograph, given the room to carry the type on its own */}
        <div className={flip ? "md:col-span-7 md:col-start-1 md:order-1" : "md:col-span-7 md:col-start-6"}>
          <h3 id={`chapter-${c.slug}-title`} className="sr-only">
            {c.title}
          </h3>

          {c.cover && (
            <PlateImage
              src={c.cover}
              alt={`${c.title} — ${c.story?.headline ?? c.tagline}`}
              width={c.coverWidth}
              height={c.coverHeight}
              sizes="(max-width: 768px) 100vw, 58vw"
              maxH="max-h-[64svh]"
            />
          )}

          {/* A glimpse of what is inside, straight to the piece itself. */}
          {preview.length > 1 && (
            <Fade>
              <ul className="mt-5 grid grid-cols-4 gap-3 md:gap-4">
                {preview.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/collections/${c.slug}/${p.id}`}
                      className="group block"
                      aria-label={`${p.name}, in ${c.title}`}
                    >
                      <span className="flex h-[clamp(4rem,9vw,7rem)] items-center justify-center">
                        <Image
                          src={p.src}
                          alt=""
                          width={p.width}
                          height={p.height}
                          sizes="(max-width: 768px) 22vw, 14vw"
                          className="block h-full w-auto max-w-full object-contain opacity-80 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
                        />
                      </span>
                      <span className="mt-2 block eyebrow text-charcoal/30 transition-colors duration-500 group-hover:text-charcoal/70">
                        {p.id.split("-").pop()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Fade>
          )}
        </div>
      </div>
    </section>
  );
}
