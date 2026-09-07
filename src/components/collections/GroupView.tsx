import Image from "next/image";
import Link from "next/link";
import type { Category, Group } from "@/lib/catalogue";
import PlateImage from "@/components/media/PlateImage";
import { RevealText, Fade } from "@/components/Reveal";

/**
 * The middle level: Collections → this group → a type → a piece.
 *
 * A group holding one type would be a wasted page if it only listed it, so the
 * single type is given a full spread here — large photograph, the story, and
 * the pieces themselves — and the reader can go straight to a chandelier
 * without passing through another index.
 */
export default function GroupView({
  group,
}: {
  group: Group & { categories: Category[] };
}) {
  const pieces = group.categories.reduce((n, c) => n + c.count, 0);
  const solo = group.categories.length === 1;

  return (
    <>
      <section
        data-nav="light"
        className="w-full bg-bone px-5 pb-[8vh] pt-[20vh] md:px-10 md:pb-[10vh] md:pt-[24vh]"
      >
        <div className="mx-auto max-w-[1800px]">
          <Fade>
            <nav aria-label="Breadcrumb" className="mb-12 md:mb-16">
              <ol className="flex flex-wrap items-center gap-x-3 eyebrow text-charcoal/40">
                <li>
                  <Link href="/collections" className="transition-colors duration-500 hover:text-charcoal">
                    Collections
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-charcoal">{group.title}</li>
              </ol>
            </nav>
          </Fade>

          <div className="grid grid-cols-1 gap-y-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <RevealText
                lines={[group.title]}
                as="h1"
                className="display text-[clamp(2.8rem,9vw,8rem)] leading-[0.95] text-charcoal"
              />
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <Fade delay={0.1}>
                <p className="body-lg text-balance text-charcoal/65">{group.intro}</p>
                <p className="mt-5 eyebrow text-charcoal/35">
                  {group.categories.length} {group.categories.length === 1 ? "type" : "types"} ·{" "}
                  {pieces} {pieces === 1 ? "piece" : "pieces"}
                </p>
              </Fade>
            </div>
          </div>
        </div>
      </section>

      {group.categories.map((c, i) => (
        <section
          key={c.slug}
          data-nav="light"
          className="w-full border-t border-charcoal/10 bg-bone px-5 py-[10vh] md:px-10 md:py-[14vh]"
        >
          <div className="mx-auto max-w-[1800px]">
            <div className="grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-12">
              <div className={solo ? "md:col-span-7" : "md:col-span-5"}>
                {c.cover && (
                  <PlateImage
                    src={c.cover}
                    alt={`${c.title} — ${c.story?.headline ?? c.tagline}`}
                    width={c.coverWidth}
                    height={c.coverHeight}
                    sizes={solo ? "(max-width: 768px) 100vw, 56vw" : "(max-width: 768px) 100vw, 40vw"}
                    maxH="max-h-[66svh]"
                  />
                )}
              </div>

              <div className={solo ? "md:col-span-4 md:col-start-9" : "md:col-span-6 md:col-start-7"}>
                <Fade>
                  <p className="eyebrow mb-5 text-charcoal/35">
                    {String(i + 1).padStart(2, "0")} — {group.title}
                  </p>
                </Fade>

                <RevealText
                  lines={[c.title]}
                  as="h2"
                  className="display text-[clamp(2.2rem,4.6vw,4rem)] leading-[1] text-charcoal"
                />

                {c.story && (
                  <Fade delay={0.05}>
                    <p className="mt-5 font-display text-[clamp(1.15rem,1.8vw,1.6rem)] italic text-charcoal/75">
                      {c.story.headline}
                    </p>
                  </Fade>
                )}

                <Fade delay={0.1}>
                  <dl className="mt-9 space-y-6 border-t border-charcoal/12 pt-7">
                    {c.story?.materials && (
                      <div>
                        <dt className="eyebrow mb-2 text-charcoal/35">Material</dt>
                        <dd className="max-w-[38ch] text-[0.92rem] leading-relaxed text-charcoal/65">
                          {c.story.materials}
                        </dd>
                      </div>
                    )}
                    {c.story?.space && (
                      <div>
                        <dt className="eyebrow mb-2 text-charcoal/35">Intended for</dt>
                        <dd className="max-w-[38ch] text-[0.92rem] leading-relaxed text-charcoal/65">
                          {c.story.space}
                        </dd>
                      </div>
                    )}
                  </dl>
                </Fade>

                {/* Straight to the pieces — a group page should not make the
                    reader take another index on the way. */}
                <Fade delay={0.15}>
                  <ul className="mt-9 grid grid-cols-4 gap-3 md:gap-4">
                    {c.products.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/collections/${c.slug}/${p.id}`}
                          className="group block"
                          aria-label={`${p.name}, in ${c.title}`}
                        >
                          <span className="flex h-[clamp(3.5rem,7vw,6rem)] items-center justify-center">
                            <Image
                              src={p.src}
                              alt=""
                              width={p.width}
                              height={p.height}
                              sizes="(max-width: 768px) 22vw, 12vw"
                              className="block h-full w-auto max-w-full object-contain opacity-85 transition-opacity duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
                            />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/collections/${c.slug}`}
                    className="group mt-9 inline-flex items-baseline gap-4 text-charcoal"
                  >
                    <span className="font-display text-[clamp(1.05rem,1.5vw,1.3rem)]">
                      {c.count === 1
                        ? `Explore the ${c.title.replace(/s$/i, "").toLowerCase()}`
                        : `Explore all ${c.count} ${c.title.toLowerCase()}`}
                    </span>
                    <span
                      aria-hidden="true"
                      className="block h-px w-10 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16 group-hover:bg-charcoal"
                    />
                  </Link>
                </Fade>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
