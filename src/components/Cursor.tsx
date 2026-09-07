"use client";

import { useEffect, useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/gsap";

/**
 * A trailing dot. Pointer devices only — touch keeps native behaviour, and the
 * real cursor is never hidden, so precision is not lost on form fields.
 *
 * Scale and opacity are eased in the same loop that moves the dot rather than
 * left to CSS variants: several utilities competed for `opacity` and the
 * cascade picked winners inconsistently between states.
 */
export default function Cursor() {
  const wrap = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isCoarsePointer() || prefersReducedMotion()) return;

    const el = wrap.current;
    const inner = dot.current;
    if (!el || !inner) return;

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const target = { ...pos };

    // 1 = resting, 2 = over something interactive, 0.5 = receded over a nav
    // label, which carries its own hover response.
    let wantScale = 1;
    let wantOpacity = 0;
    let scale = 1;
    let opacity = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      wantOpacity = wantOpacity || 1;
    };

    const interactive = "a, button, input, [role='button']";
    const onOver = (e: Event) => {
      const node = e.target as HTMLElement;
      // A dot parked on top of a nav label obscures a letter, so shrink there.
      if (node?.closest?.("[data-magnetic]")) {
        wantScale = 0.5;
        wantOpacity = 0.35;
      } else if (node?.closest?.(interactive)) {
        wantScale = 2;
        wantOpacity = 1;
      } else {
        wantScale = 1;
        wantOpacity = 1;
      }
    };
    const onLeave = () => (wantOpacity = 0);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      scale += (wantScale - scale) * 0.14;
      opacity += (wantOpacity - opacity) * 0.14;
      el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
      inner.style.transform = `scale(${scale.toFixed(3)})`;
      inner.style.opacity = opacity.toFixed(3);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[70] hidden md:block"
    >
      <span
        ref={dot}
        className="-ml-1 -mt-1 block h-2 w-2 rounded-full bg-clay opacity-0 mix-blend-difference"
      />
    </div>
  );
}
