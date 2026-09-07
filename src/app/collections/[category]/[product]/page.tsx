import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import ContactLink from "@/components/ContactLink";
import { RevealText, Fade } from "@/components/Reveal";
import { getCategories, getProduct, groupOf } from "@/lib/catalogue";
import { BRAND, CONTACT } from "@/lib/brand";

type Params = { params: Promise<{ category: string; product: string }> };

export function generateStaticParams() {
  return getCategories().flatMap((c) =>
    c.products.map((p) => ({ category: c.slug, product: p.id }))
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, product } = await params;
  const found = getProduct(category, product);
  if (!found) return {};
  return {
    title: `${found.product.name} — ${found.category.title} — ${BRAND.wordmark}`,
    description: found.product.note,
  };
}

/**
 * The end of the path: Collections → type → all pieces → this piece.
 *
 * Deliberately quiet. There is one photograph at the size it deserves, the
 * facts we actually hold, and two ways to start a conversation. No price, no
 * cart, no badges — nothing is claimed here that the catalogue cannot support.
 */
export default async function ProductPage({ params }: Params) {
  const { category, product } = await params;
  const found = getProduct(category, product);
  if (!found) notFound();

  const { category: cat, product: p, previous, next, position } = found;
  const parent = groupOf(cat.slug);

  return (
    <SiteShell>
      {/*
        A single-viewport layout rather than a stack of fixed heights.
        The page is a column of the height of the screen; the breadcrumb and the
        Next row take what they need, and the plate takes the rest. That is what
        keeps the photograph, the details and the onward link on one screen at
        720px as well as at 1440p — previously the plate alone was 850-1288px
        tall and pushed Next up to 787px below the fold.
      */}
      <article
        data-nav="light"
        className="flex min-h-[100svh] flex-col bg-bone px-5 pb-5 pt-16 md:px-10 md:pb-6 md:pt-[clamp(5.5rem,10vh,8rem)]"
      >
        <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col">
          {/* Where you are, spelled out rather than implied. */}
          <Fade>
            <nav aria-label="Breadcrumb" className="mb-4 md:mb-[clamp(1.25rem,3.5vh,3rem)]">
              <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 eyebrow text-charcoal/40">
                <li>
                  <Link href="/collections" className="transition-colors duration-500 hover:text-charcoal">
                    Collections
                  </Link>
                </li>
                {parent && (
                  <>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link
                        href={`/collections/${parent.slug}`}
                        className="transition-colors duration-500 hover:text-charcoal"
                      >
                        {parent.title}
                      </Link>
                    </li>
                  </>
                )}
                <li aria-hidden="true">/</li>
                <li>
                  <Link href={`/collections/${cat.slug}`} className="transition-colors duration-500 hover:text-charcoal">
                    {cat.title}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-charcoal">{p.name}</li>
              </ol>
            </nav>
          </Fade>

          {/* min-h-0 lets this row actually shrink; without it a grid child
              refuses to go below its content height and the column overflows. */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-y-5 md:grid-cols-12 md:gap-x-12 md:gap-y-8">
            <div className="min-h-0 md:col-span-7">
              {/* The height is taken from the viewport, not from the row.
                  A contained image asks for its intrinsic height, which would
                  grow the flex row, which would grow the page — so the ceiling
                  has to come from outside that loop. `fill` used to hide this by
                  asking for no height at all. */}
              <div className="flex h-[clamp(8rem,calc(100svh-38.5rem),20rem)] w-full items-center justify-center md:h-[clamp(16rem,calc(100svh-19rem),60rem)]">
                <Image
                  src={p.src}
                  alt={p.name}
                  width={p.width}
                  height={p.height}
                  priority
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="block h-auto max-h-full w-auto max-w-full"
                />
              </div>
            </div>

            <div className="md:col-span-4 md:col-start-9 md:self-center">
              <div>
                <Fade>
                  <p className="eyebrow mb-4 text-charcoal/35">
                    {cat.title} · {String(position).padStart(2, "0")} of{" "}
                    {String(cat.count).padStart(2, "0")}
                  </p>
                </Fade>

                <RevealText
                  lines={[p.name]}
                  as="h1"
                  className="display text-[clamp(2.2rem,4vw,3.4rem)] leading-tight text-charcoal"
                />

                <Fade delay={0.05}>
                  <p className="body-lg mt-4 text-charcoal/65">{p.note}</p>
                </Fade>

                <Fade delay={0.1}>
                  <dl className="mt-4 divide-y divide-charcoal/12 border-y border-charcoal/12 md:mt-[clamp(1.25rem,3vh,2.5rem)]">
                    {cat.story?.materials && (
                      <div className="py-[clamp(0.75rem,1.6vh,1.25rem)]">
                        <dt className="eyebrow mb-1.5 text-charcoal/35">Material</dt>
                        <dd className="line-clamp-2 text-[0.88rem] leading-relaxed text-charcoal/65 md:line-clamp-none">
                          {cat.story.materials}
                        </dd>
                      </div>
                    )}
                    {/* Two short facts share a row — stacked, they cost the
                        plate about 80px of height for no gain. */}
                    <div className="grid grid-cols-2 gap-4 py-[clamp(0.75rem,1.6vh,1.25rem)]">
                      <div>
                        <dt className="eyebrow mb-1.5 text-charcoal/35">Reference</dt>
                        <dd className="font-display text-base text-charcoal">{p.id}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow mb-1.5 text-charcoal/35">Lead time</dt>
                        <dd className="text-[0.88rem] text-charcoal/65">Sixteen weeks</dd>
                      </div>
                    </div>
                  </dl>
                </Fade>

                {/* Two ways in, both of which already work. */}
                <Fade delay={0.15}>
                  <div className="mt-4 flex flex-col gap-2.5 md:mt-[clamp(1.25rem,3vh,2.5rem)] md:gap-3">
                    <Link
                      href="/#contact"
                      className="group inline-flex items-baseline gap-4 text-charcoal"
                    >
                      <span className="font-display text-[1.2rem]">Enquire about this piece</span>
                      <span
                        aria-hidden="true"
                        className="block h-px w-10 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16 group-hover:bg-charcoal"
                      />
                    </Link>
                    <ContactLink className="eyebrow text-charcoal/50 transition-colors duration-500 hover:text-charcoal">
                      Or call {CONTACT.phone}
                    </ContactLink>
                  </div>
                </Fade>
              </div>
            </div>
          </div>

          {/* Neighbours, so a piece is never a dead end. */}
          {/* shrink-0 so the onward links keep their space and the plate is what
              gives way when the screen is short. */}
          <Fade>
            <nav
              aria-label="Other pieces"
              className="mt-4 flex shrink-0 items-stretch justify-between gap-6 border-t border-charcoal/12 pt-4 md:mt-[clamp(1.25rem,3.5vh,3rem)] md:pt-5"
            >
              {previous ? (
                <Link href={`/collections/${cat.slug}/${previous.id}`} className="group max-w-[45%]">
                  <span className="eyebrow block text-charcoal/35">Previous</span>
                  <span className="mt-1 block font-display text-[clamp(1.1rem,2vw,1.6rem)] text-charcoal/60 transition-colors duration-700 group-hover:text-charcoal">
                    {previous.name}
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {next ? (
                <Link href={`/collections/${cat.slug}/${next.id}`} className="group max-w-[45%] text-right">
                  <span className="eyebrow block text-charcoal/35">Next</span>
                  <span className="mt-1 block font-display text-[clamp(1.1rem,2vw,1.6rem)] text-charcoal/60 transition-colors duration-700 group-hover:text-charcoal">
                    {next.name}
                  </span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </Fade>
        </div>
      </article>
    </SiteShell>
  );
}
