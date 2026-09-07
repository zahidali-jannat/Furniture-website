"use client";

import RevealImage from "@/components/media/RevealImage";
import ScrollVideo from "@/components/media/ScrollVideo";
import { RevealText, Fade } from "@/components/Reveal";
import { shot } from "@/lib/shots";

const SPECS = [
  ["Sonde 5", "Spun copper, hand-polished", "5 drops, staggered"],
  ["Rail 180", "Extruded aluminium, matte black", "1800 mm, dimmable"],
];

export default function Lighting() {
  const pendant = shot("linear-pendant");

  return (
    <section
      id="lighting"
      data-nav="dark"
      className="relative w-full overflow-hidden bg-ink px-5 py-[14vh] text-bone md:px-10 md:py-[20vh]"
    >
      <div className="mx-auto max-w-[1800px]">
        <Fade>
          <p className="eyebrow mb-8 text-bone/40 md:mb-14">05 — Lighting</p>
        </Fade>

        <div className="grid grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-10">
          {/* The cascade wipes downward, so the drops read as descending. */}
          <div className="md:col-span-5">
            <RevealImage
              src="/img/copper-pendants.jpg"
              alt="Five spun-copper bell pendants hanging at staggered heights"
              className="aspect-[2/3] w-full"
              sizes="(max-width: 768px) 100vw, 40vw"
              from="down"
              parallax={8}
              zoom={1.1}
            />
            <Fade className="mt-5 flex items-baseline justify-between">
              <span className="eyebrow text-bone/30">Fig. 02</span>
              <span className="eyebrow text-bone/30">Sonde 5</span>
            </Fade>
          </div>

          <div className="flex flex-col justify-between md:col-span-6 md:col-start-7">
            <div>
              <RevealText
                lines={["It is never the", "lamp you notice.", "It is the hour."]}
                className="display text-[clamp(2.1rem,4.6vw,4.4rem)]"
                italicLast
              />
              <Fade delay={0.1}>
                <p className="body-lg mt-8 max-w-[42ch] text-bone/60 md:mt-12">
                  Every fitting we make is warm-dim: it drops to 1800 K as it
                  fades, the way a filament does, the way the sun does.
                </p>
              </Fade>
            </div>

            {/* Shot 03 drifts along the fixture's axis — scroll drives the pass. */}
            <div className="mt-12 md:mt-16">
              <ScrollVideo
                shot={pendant}
                className="media-frame aspect-[16/9] w-full"
              />
              <Fade>
                <dl className="mt-8 divide-y divide-bone/10 border-t border-bone/10">
                  {SPECS.map(([name, material, size]) => (
                    <div key={name} className="grid grid-cols-3 gap-4 py-4">
                      <dt className="font-display text-lg text-bone">{name}</dt>
                      <dd className="text-[0.82rem] leading-relaxed text-bone/55">{material}</dd>
                      <dd className="text-right text-[0.82rem] leading-relaxed text-bone/55">{size}</dd>
                    </div>
                  ))}
                </dl>
              </Fade>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
