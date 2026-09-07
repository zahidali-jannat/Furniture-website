import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import ProductCard from "@/components/ProductCard";
import { RevealText, Fade } from "@/components/Reveal";
import GroupView from "@/components/collections/GroupView";
import { getCategories, getCategory, getGroupBySlug, getGroupSlugs, groupOf } from "@/lib/catalogue";
import { BRAND } from "@/lib/brand";

type Params = { params: Promise<{ category: string }> };

/**
 * One segment carries both levels of the hierarchy — /collections/lighting and
 * /collections/chandeliers — so the URLs stay clean. Group and category slugs
 * are checked at build time to be sure neither can shadow the other.
 */
export function generateStaticParams() {
  return [
    ...getGroupSlugs().map((slug) => ({ category: slug })),
    ...getCategories().map((c) => ({ category: c.slug })),
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = (await params).category;
  const group = getGroupBySlug(slug);
  if (group) return { title: `${group.title} — ${BRAND.wordmark}`, description: group.intro };
  const cat = getCategory(slug);
  if (!cat) return {};
  return { title: `${cat.title} — ${BRAND.wordmark}`, description: cat.intro };
}

/**
 * Products alternate between a wide and a narrow column so the page reads as a
 * spread rather than a catalogue. The pattern is driven by index, so it holds
 * for one product or forty.
 */
const RHYTHM = [
  { span: "md:col-span-7", aspect: "max-h-[58svh]", offset: "" },
  { span: "md:col-span-4 md:col-start-9", aspect: "max-h-[52svh]", offset: "md:mt-[14vh]" },
  { span: "md:col-span-5 md:col-start-1", aspect: "max-h-[56svh]", offset: "md:mt-[10vh]" },
  { span: "md:col-span-6 md:col-start-7", aspect: "max-h-[54svh]", offset: "md:mt-[4vh]" },
];

export default async function CategoryPage({ params }: Params) {
  const slug = (await params).category;

  // A group slug renders the middle level of the hierarchy instead.
  const group = getGroupBySlug(slug);
  if (group) {
    return (
      <SiteShell>
        <GroupView group={group} />
      </SiteShell>
    );
  }

  const cat = getCategory(slug);
  if (!cat) notFound();

  const parent = groupOf(cat.slug);
  const others = getCategories().filter((c) => c.slug !== cat.slug);

  return (
    <SiteShell>
      <section
        data-nav="light"
        className="relative w-full bg-bone px-5 pb-[10vh] pt-[22vh] md:px-10 md:pb-[14vh] md:pt-[26vh]"
      >
        <div className="mx-auto max-w-[1800px]">
          <Fade>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-x-3 eyebrow text-charcoal/40">
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
                <li className="text-charcoal">{cat.title}</li>
              </ol>
            </nav>
          </Fade>

          <div className="mt-10 grid grid-cols-1 gap-y-8 md:mt-16 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              <RevealText
                lines={[cat.title]}
                className="display text-[clamp(2.8rem,9vw,8rem)] text-charcoal"
              />
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <Fade delay={0.1}>
                <p className="body-lg text-balance text-charcoal/65">{cat.intro}</p>
                <p className="mt-5 eyebrow text-charcoal/35">
                  {cat.count} {cat.count === 1 ? "piece" : "pieces"}
                </p>
              </Fade>
            </div>
          </div>
        </div>
      </section>

      <section data-nav="light" className="w-full bg-bone px-5 pb-[16vh] md:px-10 md:pb-[22vh]">
        <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-y-20 md:grid-cols-12 md:gap-x-10 md:gap-y-0">
          {cat.products.map((p, i) => {
            const r = RHYTHM[i % RHYTHM.length];
            return (
              <div key={p.id} className={`${r.span} ${r.offset}`}>
                <ProductCard
                  product={p}
                  categorySlug={cat.slug}
                  aspect={r.aspect}
                  sizes="(max-width: 768px) 100vw, 55vw"
                  index={i}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Onward, so a category is never a dead end. */}
      <section data-nav="light" className="w-full bg-bone px-5 pb-[14vh] md:px-10 md:pb-[18vh]">
        <div className="mx-auto max-w-[1800px] border-t border-charcoal/12 pt-10">
          <p className="eyebrow mb-8 text-charcoal/40">Continue</p>
          <ul className="flex flex-wrap gap-x-10 gap-y-4">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/collections/${o.slug}`}
                  className="group inline-flex items-baseline gap-3 font-display text-[clamp(1.6rem,3.4vw,2.8rem)] text-charcoal/45 transition-colors duration-700 hover:text-charcoal"
                >
                  {o.title}
                  <span className="eyebrow text-charcoal/25">{o.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
