"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro";
import { BRAND } from "@/lib/brand";

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  // Driven from GSAP's ticker, never synchronously from the effect body.
  const [count, setCount] = useState(0);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const dismiss = () => {
      document.documentElement.style.overflow = "";
      el.style.display = "none";
      markIntroDone();
    };

    if (prefersReducedMotion()) {
      dismiss();
      return;
    }

    document.documentElement.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      gsap
        .timeline({ onComplete: dismiss })
        .to(counter, {
          v: 100,
          duration: 1.35,
          ease: "power2.inOut",
          onUpdate: () => {
            const v = Math.round(counter.v);
            setCount(v);
            if (bar.current) bar.current.style.width = `${v}%`;
          },
        })
        .to(".pl-fade", { opacity: 0, duration: 0.45, ease: "power2.out" }, "-=0.1")
        // The curtain leaves upward, handing the page to the hero.
        .to(el, { yPercent: -100, duration: 1.15, ease: EASE }, "-=0.15");
    }, root);

    return () => {
      document.documentElement.style.overflow = "";
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-bone px-5 py-6 md:px-10 md:py-8"
    >
      <p className="pl-fade eyebrow text-charcoal/50">{BRAND.name}</p>

      {/* pr-2 clears the serif's right overhang, which the clamp would clip. */}
      <p
        ref={label}
        className="pl-fade display self-end pr-2 text-[clamp(3.5rem,14vw,12rem)] leading-none text-charcoal tabular-nums"
      >
        {String(count).padStart(3, "0")}
      </p>

      <div className="pl-fade h-px w-full bg-charcoal/15">
        <div ref={bar} className="h-full w-0 bg-charcoal/60" />
      </div>
    </div>
  );
}
