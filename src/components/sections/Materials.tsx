"use client";

import RevealImage from "@/components/media/RevealImage";
import { RevealText, Fade } from "@/components/Reveal";

const MATERIALS = [
  {
    n: "01",
    name: "European oak",
    body:
      "Cut from stands within four hundred kilometres of the workshop, air-dried for two winters before it is touched. It arrives pale and leaves the room darker every year.",
  },
  {
    n: "02",
    name: "Bouclé",
    body:
      "A looped wool, woven in Kortrijk on machines older than the company. It pills in the first month, then never again — the surface finds its own settled state.",
  },
  {
    n: "03",
    name: "Microcement",
    body:
      "Trowelled in six passes over three days. No two panels are the same and we do not try to make them so; the hand is the point.",
  },
  {
    n: "04",
    name: "Nero marquina",
    body:
      "Quarried in Markina, cut to a 20 mm edge and honed rather than polished, so the white veining reads as drawing instead of gloss.",
  },
];

export default function Materials() {
  return (
    <section
      id="materials"
      data-nav="light"
      className="relative w-full bg-bone px-5 py-[14vh] md:px-10 md:py-[20vh]"
    >
      <div className="mx-auto max-w-[1800px]">
        <Fade>
          <p className="eyebrow mb-8 text-charcoal/45 md:mb-14">06 — Materials</p>
        </Fade>

        <div className="grid grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-12">
          {/* Sticky portrait plate against a scrolling column of notes. The
              grid item must stretch to the row height — `self-start` would
              collapse it to its content and leave the sticky child no travel. */}
          <div className="md:col-span-5">
            <div className="md:sticky md:top-[13vh]">
              <RevealImage
                src="/img/fluted-wall.jpg"
                alt="A fluted plaster wall lit by a hidden strip beneath a stone shelf"
                className="aspect-[3/4] w-full md:aspect-[4/5]"
                sizes="(max-width: 768px) 100vw, 40vw"
                parallax={5}
              />
              <Fade className="mt-5 flex items-baseline justify-between">
                <span className="eyebrow text-charcoal/35">Fig. 03</span>
                <span className="eyebrow text-charcoal/35">Plaster, oak, stone</span>
              </Fade>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <RevealText
              lines={["Four things,", "used honestly."]}
              className="display mb-12 text-[clamp(2.1rem,4.6vw,4.2rem)] text-charcoal md:mb-20"
              italicLast
            />

            <ol className="divide-y divide-charcoal/12 border-t border-charcoal/12">
              {MATERIALS.map((m) => (
                <li key={m.n}>
                  <Fade>
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 py-10 md:gap-x-10 md:py-14">
                      <span className="eyebrow pt-1 text-charcoal/30">{m.n}</span>
                      <div>
                        <h3 className="font-display text-[clamp(1.5rem,2.4vw,2.2rem)] leading-tight text-charcoal">
                          {m.name}
                        </h3>
                        <p className="body-lg mt-4 max-w-[46ch] text-charcoal/65">{m.body}</p>
                      </div>
                    </div>
                  </Fade>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
