"use client";

import { useState } from "react";
import RevealImage from "@/components/media/RevealImage";
import LoopVideo from "@/components/media/LoopVideo";
import { RevealText, Fade } from "@/components/Reveal";
import { shot } from "@/lib/shots";

/** Positions are percentages of the plate, placed against the actual photograph. */
const HOTSPOTS = [
  { x: 27, y: 39, label: "Arc floor lamp", note: "Pleated linen shade on blackened steel" },
  { x: 40, y: 77, label: "Drum table", note: "Solid ash, ebonised and waxed" },
  { x: 64, y: 66, label: "Chaise module", note: "Moss cotton velvet over feather-down" },
];

export default function Signature() {
  const [open, setOpen] = useState<number | null>(null);
  const detail = shot("modular-sofa");

  return (
    <section
      id="signature"
      data-nav="dark"
      className="relative w-full overflow-hidden bg-ink px-5 py-[14vh] text-bone md:px-10 md:py-[18vh]"
    >
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <div>
            <Fade>
              <p className="eyebrow mb-6 text-bone/40">03 — The signature piece</p>
            </Fade>
            <RevealText
              lines={["Halden, in moss."]}
              className="display text-[clamp(2.4rem,6vw,5.6rem)]"
            />
          </div>
          <Fade>
            <p className="body-lg max-w-[32ch] text-bone/60">
              A four-metre chaise sectional. Nine modules, one seam line, no
              visible fixings.
            </p>
          </Fade>
        </div>

        {/* The only landscape still in the set — it gets the full-width plate. */}
        <div className="relative">
          <RevealImage
            src="/img/olive-sectional.jpg"
            alt="An olive velvet modular chaise sectional in a bright apartment"
            className="aspect-[16/10] w-full"
            sizes="(max-width: 768px) 100vw, 92vw"
            parallax={4}
            zoom={1.08}
          />

          {HOTSPOTS.map((h, i) => (
            <div
              key={h.label}
              className="absolute hidden md:block"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <button
                type="button"
                aria-expanded={open === i}
                aria-label={`${h.label}: ${h.note}`}
                onMouseEnter={() => setOpen(i)}
                onMouseLeave={() => setOpen((v) => (v === i ? null : v))}
                onFocus={() => setOpen(i)}
                onBlur={() => setOpen((v) => (v === i ? null : v))}
                onClick={() => setOpen((v) => (v === i ? null : i))}
                className="group relative -ml-3 -mt-3 grid h-6 w-6 place-items-center outline-none"
              >
                <span className="absolute inset-0 rounded-full border border-bone/70 opacity-60 [animation:hotspot_3s_cubic-bezier(0.16,1,0.3,1)_infinite]" />
                <span className="h-1.5 w-1.5 rounded-full bg-bone transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-150" />
              </button>

              <div
                className={[
                  "pointer-events-none absolute left-6 top-0 w-56 border-l border-bone/25 bg-ink/85 px-4 py-3 backdrop-blur-sm transition-all duration-500",
                  open === i ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                ].join(" ")}
                style={{ transitionTimingFunction: "var(--ease-lux)" }}
              >
                <p className="eyebrow mb-1 text-bone">{h.label}</p>
                <p className="text-[0.8rem] leading-relaxed text-bone/60">{h.note}</p>
              </div>
            </div>
          ))}

          {/* Shot 06 runs as a silent detail loop, overlapping the plate. */}
          <div className="absolute -bottom-10 right-0 hidden w-[22vw] max-w-[320px] md:block lg:-bottom-14">
            <div className="media-frame aspect-[4/3] w-full border border-bone/10">
              <LoopVideo
                src={detail.src}
                poster={detail.poster}
                rate={0.7}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="eyebrow mt-3 text-bone/35">Detail — seat and weave</p>
          </div>
        </div>

        <Fade>
          <dl className="mt-24 grid grid-cols-2 gap-y-8 border-t border-bone/15 pt-8 md:mt-32 md:grid-cols-4 md:gap-x-10">
            {[
              ["Dimensions", "412 × 186 × 68 cm"],
              ["Frame", "Kiln-dried ash"],
              ["Upholstery", "Cotton velvet, 14 colours"],
              ["Lead time", "16 weeks"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="eyebrow mb-2 text-bone/35">{k}</dt>
                <dd className="body-lg text-bone/85">{v}</dd>
              </div>
            ))}
          </dl>
        </Fade>
      </div>

      <style>{`@keyframes hotspot{0%{transform:scale(.55);opacity:.8}70%,100%{transform:scale(1.6);opacity:0}}`}</style>
    </section>
  );
}
