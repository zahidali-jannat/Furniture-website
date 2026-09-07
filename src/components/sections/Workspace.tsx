"use client";

import { useLayoutEffect, useRef } from "react";
import ScrollVideo from "@/components/media/ScrollVideo";
import { RevealText, Fade } from "@/components/Reveal";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { shot } from "@/lib/shots";

/** Each note surfaces at a fixed point in the shot's own timeline. */
const NOTES = [
  { at: 0.18, text: "Solid walnut, 34 mm, oiled" },
  { at: 0.52, text: "Cable race hidden in the apron" },
  { at: 0.84, text: "Blackened steel understructure" },
];

export default function Workspace() {
  const root = useRef<HTMLElement>(null);
  const desk = shot("walnut-desk");

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".ws-note").forEach((note) => {
        const at = Number(note.dataset.at);
        gsap.fromTo(
          note,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: `top+=${at * 100 - 10}% top`,
              end: `top+=${at * 100 + 6}% top`,
              scrub: true,
            },
          }
        );
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="workspace"
      data-nav="dark"
      ref={root}
      className="relative bg-charcoal text-bone"
    >
      <div className="h-[240vh]">
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1800px] grid-cols-1 items-center gap-8 px-5 md:grid-cols-12 md:gap-12 md:px-10">
            <div className="md:col-span-4">
              <Fade>
                <p className="eyebrow mb-6 text-bone/40">07 — The workspace</p>
              </Fade>
              <RevealText
                lines={["A desk you", "grow into."]}
                className="display text-[clamp(2rem,3.8vw,3.6rem)]"
                italicLast
              />

              <ul className="mt-10 space-y-4 md:mt-14">
                {NOTES.map((n) => (
                  <li
                    key={n.text}
                    data-at={n.at}
                    className="ws-note flex items-baseline gap-4 border-l border-bone/25 pl-4"
                  >
                    <span className="body-lg text-bone/75">{n.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scroll drives the push-in; the section is tall enough to make
                the move feel deliberate rather than twitchy. */}
            <div className="md:col-span-7 md:col-start-6">
              <ScrollVideo
                shot={desk}
                triggerRef={root}
                start="top top"
                end="bottom bottom"
                className="media-frame aspect-[4/3] w-full md:aspect-[3/2]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
