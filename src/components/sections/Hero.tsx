"use client";

import { useLayoutEffect, useRef } from "react";
import LoopVideo from "@/components/media/LoopVideo";
import { shot } from "@/lib/shots";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { whenIntroDone } from "@/lib/intro";

const LINES = [
  { text: "Rooms that", italic: false },
  { text: "hold their", italic: false },
  { text: "silence.", italic: true },
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const tl = gsap
        .timeline({ paused: true })
        .from(".hero-frame", { yPercent: 7, scale: 1.06, duration: 1.9, ease: EASE }, 0)
        .from(".hero-line", { yPercent: 112, duration: 1.5, ease: EASE, stagger: 0.09 }, 0.25)
        .from(".hero-fade", { opacity: 0, y: 14, duration: 1.2, ease: EASE, stagger: 0.07 }, 0.75);

      whenIntroDone().then(() => tl.play());
    }, root);
    return () => ctx.revert();
  }, []);

  const s = shot("living-wide");

  return (
    <section
      ref={root}
      id="hero"
      data-nav="light"
      data-nav-mobile="dark"
      className="relative min-h-[100svh] w-full overflow-hidden bg-bone"
    >
      {/* The video sits in a contained frame rather than full bleed — the source
          is 1136px wide, so stretching it edge to edge would show on a large
          display. Its left edge is set so the headline crosses it, and its top
          edge clears the nav bar so the links stay on the bone. */}
      <div className="absolute inset-y-0 right-0 w-full md:bottom-[8vh] md:left-[47%] md:top-[13vh] md:w-auto md:right-[2.5vw]">
        <div className="hero-frame media-frame h-full w-full">
          <LoopVideo
            src={s.src}
            poster={s.poster}
            rate={0.6}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 via-charcoal/10 to-charcoal/45 md:from-charcoal/15 md:via-transparent md:to-transparent" />
        </div>
      </div>

      {/* DOM order puts this above the video; no z-index needed. */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-[1800px] flex-col px-5 pb-8 pt-28 md:px-10 md:pb-10 md:pt-[19vh]">
        <p className="hero-fade eyebrow text-bone/70 md:text-charcoal/50">
          Slow furniture — oak, bouclé, stone
        </p>

        {/* `hero-copy` holds the column clear of the video frame at every
            width — see globals.css. The headline used to run 187-333px into
            the frame, relying on a difference blend to stay readable; plain
            charcoal on bone is cleaner now that nothing overlaps. */}
        <h1 className="display hero-copy mt-auto text-[clamp(2.9rem,9.6vw,9rem)] text-bone md:mt-6 md:text-charcoal">
          {LINES.map((line) => (
            <span key={line.text} className="line-mask">
              <span className={`hero-line line-inner${line.italic ? " italic" : ""}`}>
                {line.text}
              </span>
            </span>
          ))}
        </h1>

        {/* Confined to the text column so the rule never crosses the video. */}
        <div className="hero-fade mt-auto border-t border-bone/25 pt-5 md:max-w-[36%] md:border-charcoal/15">
          <p className="body-lg max-w-[34ch] text-balance text-bone/80 md:text-charcoal/65">
            Made in runs of forty. Each piece leaves the workshop with the name of
            the person who finished it.
          </p>

          <div className="mt-6 hidden items-end justify-between md:flex">
            <span className="eyebrow text-charcoal/35">01 — 07</span>
            <a href="#statement" className="group flex items-center gap-3 eyebrow text-charcoal/70">
              Scroll
              <span className="relative block h-9 w-px overflow-hidden bg-charcoal/20">
                <span className="absolute inset-x-0 top-0 block h-4 bg-charcoal [animation:heroCue_2.6s_cubic-bezier(0.16,1,0.3,1)_infinite]" />
              </span>
            </a>
          </div>
        </div>
      </div>

      <style>{`@keyframes heroCue{0%{transform:translateY(-120%)}55%,100%{transform:translateY(340%)}}`}</style>
    </section>
  );
}
