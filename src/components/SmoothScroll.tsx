"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

/**
 * Lenis drives the page; GSAP's ticker drives Lenis. ScrollTrigger is updated
 * from Lenis's scroll event so pinning stays in sync with the smoothed value.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // ?static drops smooth scrolling and falls back to native scroll. Useful
    // when inspecting layout, since smoothed scroll makes screenshots race.
    if (new URLSearchParams(window.location.search).has("static")) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
      wheelMultiplier: 0.9,
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    // Handy from the console when checking layout at a given scroll position.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Trigger positions computed before the webfont swaps or the images
    // reserve their height are wrong, which leaves sections stuck in their
    // "from" state. Recompute once the page has actually settled.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    const settle = window.setTimeout(refresh, 1200);
    refresh();

    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("load", refresh);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
