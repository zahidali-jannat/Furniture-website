"use client";

import RevealImage from "@/components/media/RevealImage";
import { RevealText, Fade } from "@/components/Reveal";

export default function Statement() {
  return (
    <section
      id="statement"
      data-nav="light"
      className="relative w-full overflow-hidden bg-bone px-5 py-[16vh] md:px-10 md:py-[22vh]"
    >
      <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-10">
        {/* Portrait plate, deliberately small against a lot of air. Six of the
            seven stills are vertical, so the layout is built around columns
            rather than full-bleed bands. */}
        <div className="order-2 md:order-1 md:col-span-4 md:col-start-1 md:self-end">
          <RevealImage
            src="/img/arch-portal.jpg"
            alt="An arched opening in a white plaster wall framing a charcoal sofa"
            className="aspect-[2/3] w-full"
            sizes="(max-width: 768px) 100vw, 32vw"
            parallax={6}
          />
          <Fade className="mt-5 flex items-baseline justify-between">
            <span className="eyebrow text-charcoal/35">Fig. 01</span>
            <span className="eyebrow text-charcoal/35">The empty room</span>
          </Fade>
        </div>

        <div className="order-1 md:order-2 md:col-span-7 md:col-start-6 md:self-center">
          <Fade>
            <p className="eyebrow mb-10 text-charcoal/45 md:mb-14">02 — On making</p>
          </Fade>

          <RevealText
            lines={["Every room begins", "as an empty one."]}
            className="display text-[clamp(2.4rem,5.4vw,5.2rem)] text-charcoal"
            italicLast
          />

          <Fade delay={0.1}>
            <div className="mt-10 max-w-[46ch] space-y-6 md:mt-14">
              <p className="body-lg text-charcoal/70">
                We do not design for the photograph. We design for the fourth year,
                when the oak has darkened a shade and the bouclé has taken the shape
                of whoever sits there most.
              </p>
              <p className="body-lg text-charcoal/70">
                Forty of each piece, then the run closes. No restock, no seasonal
                refresh — only the next thing, when it is ready.
              </p>
            </div>
          </Fade>
        </div>
      </div>
    </section>
  );
}
