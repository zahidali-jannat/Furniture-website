"use client";

import RevealImage from "@/components/media/RevealImage";
import { RevealText, Fade } from "@/components/Reveal";

/**
 * The only photograph in the set — everything else is rendered. Rather than
 * hide the shift, this section names it: a journal entry from a real home.
 */
export default function Homes() {
  return (
    <section
      id="homes"
      data-nav="light"
      className="relative w-full bg-bone px-5 py-[14vh] md:px-10 md:py-[20vh]"
    >
      <div className="mx-auto max-w-[1800px]">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-6 md:col-start-1 md:self-center">
            <Fade>
              <p className="eyebrow mb-8 text-charcoal/45">08 — Journal</p>
            </Fade>
            <RevealText
              lines={["Four years in,", "on a hill above", "the city."]}
              className="display text-[clamp(2.1rem,4.6vw,4.2rem)] text-charcoal"
              italicLast
            />
            <Fade delay={0.1}>
              <div className="mt-10 max-w-[46ch] space-y-6 md:mt-14">
                <p className="body-lg text-charcoal/70">
                  The Aperture went into this room in its first month. It has
                  since been reupholstered once, moved twice, and slept on more
                  often than its owners will admit.
                </p>
                <p className="body-lg text-charcoal/70">
                  We photograph our pieces new because we have to. This is what
                  we actually make them for.
                </p>
              </div>
            </Fade>
            <Fade delay={0.15}>
              <a
                href="#contact"
                className="group mt-12 inline-flex items-center gap-4 eyebrow text-charcoal/70 transition-colors duration-500 hover:text-charcoal md:mt-16"
              >
                Read the entry
                <span className="block h-px w-12 origin-left bg-current transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-150" />
              </a>
            </Fade>
          </div>

          <div className="md:col-span-5 md:col-start-8">
            <RevealImage
              src="/img/loft-dusk.jpg"
              alt="A cream sectional in a double-height loft at dusk, city lights beyond"
              className="aspect-[2/3] w-full"
              sizes="(max-width: 768px) 100vw, 40vw"
              parallax={6}
            />
            <Fade className="mt-5 flex items-baseline justify-between">
              <span className="eyebrow text-charcoal/35">Fig. 04</span>
              <span className="eyebrow text-charcoal/35">Photograph, not render</span>
            </Fade>
          </div>
        </div>
      </div>
    </section>
  );
}
