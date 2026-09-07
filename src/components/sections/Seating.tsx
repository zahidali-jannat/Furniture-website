"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import ScrollVideo from "@/components/media/ScrollVideo";
import { RevealText, Fade } from "@/components/Reveal";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { shot } from "@/lib/shots";

/**
 * A horizontal rail driven by vertical scroll. The viewport-height panel is
 * `sticky` rather than ScrollTrigger-pinned — sticky keeps the browser in
 * charge of the layout, which avoids the pin-spacer jitter under smooth scroll.
 */
export default function Seating() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const chair = shot("boucle-chair");

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const el = rail.current;
      if (!el) return;

      const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);

      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      return () => tween.kill();
    }, root);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  return (
    <section id="seating" data-nav="dark" ref={root} className="relative bg-charcoal text-bone">
      {/* Height gives the rail its scroll distance; the panel inside is sticky. */}
      <div className="h-[320vh] md:h-[380vh]">
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
          <div className="shrink-0 px-5 pb-8 pt-24 md:px-10 md:pb-10">
            <Fade>
              <p className="eyebrow text-bone/40">04 — Seating</p>
            </Fade>
          </div>

          <div
            ref={rail}
            className="flex items-center gap-[5vw] px-5 will-change-transform md:px-10"
          >
            {/* 1 — statement card */}
            <div className="flex w-[78vw] shrink-0 flex-col justify-center md:w-[30vw]">
              <RevealText
                lines={["Four chairs.", "Nothing else", "this year."]}
                className="display text-[clamp(2.2rem,4.4vw,4rem)]"
                italicLast
              />
              <p className="body-lg mt-8 max-w-[30ch] text-bone/60">
                Drag or scroll. Each piece is photographed where it was
                prototyped, before it had a name.
              </p>
            </div>

            {/* 2 — terracotta settee */}
            <Card
              index="01"
              name="Fri settee"
              meta="Terracotta wool · oak"
              className="w-[78vw] md:w-[32vw]"
            >
              <Image
                src="/img/terracotta-settee.jpg"
                alt="A terracotta upholstered settee on slim oak legs"
                fill
                sizes="(max-width: 768px) 78vw, 32vw"
                className="object-cover"
              />
            </Card>

            {/* 3 — the bouclé chair, scrubbed by this section's own progress */}
            <Card
              index="02"
              name="Halden lounge"
              meta="Bouclé · lacquered base"
              className="w-[78vw] md:w-[34vw]"
            >
              <ScrollVideo
                shot={chair}
                triggerRef={root}
                start="top top"
                end="bottom bottom"
                className="h-full w-full object-cover"
              />
            </Card>

            {/* 4 — arch portal */}
            <Card
              index="03"
              name="Aperture sofa"
              meta="Charcoal linen · ash"
              className="w-[78vw] md:w-[26vw]"
            >
              <Image
                src="/img/arch-portal.jpg"
                alt="A charcoal sofa seen through an arched opening"
                fill
                sizes="(max-width: 768px) 78vw, 26vw"
                className="object-cover"
              />
            </Card>

            <div className="flex w-[70vw] shrink-0 items-center md:w-[24vw]">
              <a
                href="#lighting"
                className="group inline-flex items-center gap-4 eyebrow text-bone/70 transition-colors duration-500 hover:text-bone"
              >
                The full catalogue
                <span className="block h-px w-12 origin-left bg-current transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-150" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({
  index,
  name,
  meta,
  className = "",
  children,
}: {
  index: string;
  name: string;
  meta: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={`shrink-0 ${className}`}>
      <div className="media-frame h-[52svh] w-full md:h-[62svh]">{children}</div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="eyebrow text-bone/35">{index}</span>
        <span className="flex-1 text-right">
          <span className="block font-display text-lg text-bone">{name}</span>
          <span className="eyebrow text-bone/40">{meta}</span>
        </span>
      </figcaption>
    </figure>
  );
}
