"use client";

import RevealImage from "@/components/media/RevealImage";
import { RevealText, Fade } from "@/components/Reveal";

/**
 * This still is the outlier in the set — warmer, more decorative, more brass
 * than anything else here. It is graded back toward the site palette rather
 * than left to fight it.
 */
export default function Bedroom() {
  return (
    <section
      id="bedroom"
      data-nav="light"
      className="relative w-full overflow-hidden bg-oat/45 px-5 py-[14vh] md:px-10 md:py-[18vh]"
    >
      <div className="mx-auto max-w-[1800px]">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-7">
            <div className="[filter:saturate(0.74)_sepia(0.09)_contrast(1.04)_brightness(0.98)]">
              <RevealImage
                src="/img/bedroom-brass.jpg"
                alt="An upholstered platform bed with a brass and crystal pendant above"
                className="aspect-[4/5] w-full"
                sizes="(max-width: 768px) 100vw, 56vw"
                parallax={5}
              />
            </div>
          </div>

          <div className="flex flex-col md:col-span-4 md:col-start-9 md:self-center">
            <div>
              <Fade>
                <p className="eyebrow mb-8 text-charcoal/45">09 — Bedroom</p>
              </Fade>
              <RevealText
                lines={["The quietest", "room, last."]}
                className="display text-[clamp(2rem,3.6vw,3.4rem)] text-charcoal"
                italicLast
              />
              <Fade delay={0.1}>
                <p className="body-lg mt-8 max-w-[34ch] text-charcoal/70">
                  A linen platform, a low bench, two lamps that will not wake
                  the person beside you. The collection opens in spring.
                </p>
              </Fade>
            </div>

            <Fade>
              <div className="mt-14 border-t border-charcoal/15 pt-6">
                <p className="eyebrow text-charcoal/35">Arriving</p>
                <p className="mt-2 font-display text-2xl text-charcoal">March</p>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </section>
  );
}
