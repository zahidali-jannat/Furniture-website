import Link from "next/link";
import PlateImage from "@/components/media/PlateImage";
import { RevealText, Fade } from "@/components/Reveal";
import { getChapters, getForthcoming } from "@/lib/catalogue";

/**
 * The homepage's door into the catalogue — an invitation, not a copy of it.
 *
 * Duplicating the chapter journey here would make the Collections page
 * redundant before the reader arrives. So this names the types, gives the size
 * of the range, and gets out of the way.
 */
export default function CollectionsTeaser() {
  const chapters = getChapters();
  const forthcoming = getForthcoming();
  const pieces = chapters.reduce((n, c) => n + c.count, 0);
  const lead = chapters[0];

  return (
    <section
      id="collections"
      data-nav="light"
      className="relative w-full bg-bone px-5 py-[14vh] md:px-10 md:py-[20vh]"
    >
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-12">
        <div className="md:col-span-5 md:self-center">
          <Fade>
            <p className="eyebrow mb-8 text-charcoal/45">Collections</p>
          </Fade>

          <RevealText
            lines={["Everything we", "make, in one", "place."]}
            className="display text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[1.02] text-charcoal"
            italicLast
          />

          <Fade delay={0.1}>
            <ul className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              {chapters.map((c) => (
                <li key={c.slug} className="font-display text-[clamp(1.3rem,2.2vw,1.9rem)] text-charcoal/70">
                  {c.title}
                </li>
              ))}
              {forthcoming.map((c) => (
                <li key={c.slug} className="font-display text-[clamp(1.3rem,2.2vw,1.9rem)] text-charcoal/20">
                  {c.title}
                </li>
              ))}
            </ul>

            <p className="body-lg mt-8 max-w-[40ch] text-charcoal/60">
              {pieces} pieces across {chapters.length} types. Read the whole
              catalogue in one pass, then take whichever turning interests you.
            </p>

            <Link
              href="/collections"
              className="group mt-10 inline-flex items-baseline gap-4 text-charcoal"
            >
              <span className="font-display text-[clamp(1.15rem,1.8vw,1.5rem)]">
                Enter the collections
              </span>
              <span
                aria-hidden="true"
                className="block h-px w-12 origin-left bg-charcoal/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-20 group-hover:bg-charcoal"
              />
            </Link>
          </Fade>
        </div>

        {lead?.cover && (
          <div className="md:col-span-6 md:col-start-7">
            <PlateImage
              src={lead.cover}
              alt="From the collections"
              width={lead.coverWidth}
              height={lead.coverHeight}
              sizes="(max-width: 768px) 100vw, 50vw"
              maxH="max-h-[68svh]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
