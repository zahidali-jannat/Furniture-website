"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BRAND, CONTACT, NAV, telHref } from "@/lib/brand";
import { ScrollTrigger, isCoarsePointer, prefersReducedMotion } from "@/lib/gsap";

/**
 * The bar is fixed and never blends. `mix-blend-mode` on a fixed element
 * detaches it from the viewport in some compositors, so the colour is flipped
 * instead: every section declares `data-nav="light|dark"` describing what sits
 * beneath the bar, and the text colour follows.
 */
export default function Nav() {
  const [onDark, setOnDark] = useState(false);
  const [condensed, setCondensed] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const onHome = usePathname() === "/";

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]"));

    // A section can declare a different tone for narrow screens, where a
    // full-bleed video may sit behind the bar that is not there on desktop.
    const mq = window.matchMedia("(max-width: 767px)");
    const toneOf = (el: HTMLElement) =>
      (mq.matches && el.dataset.navMobile ? el.dataset.navMobile : el.dataset.nav) === "dark";

    let current: HTMLElement | null = null;
    const apply = (el: HTMLElement) => {
      current = el;
      setOnDark(toneOf(el));
    };
    const onMq = () => current && setOnDark(toneOf(current));
    mq.addEventListener("change", onMq);

    const triggers = sections.map((sec) =>
      ScrollTrigger.create({
        trigger: sec,
        start: "top top+=56",
        end: "bottom top+=56",
        onEnter: () => apply(sec),
        onEnterBack: () => apply(sec),
      })
    );
    return () => {
      mq.removeEventListener("change", onMq);
      triggers.forEach((t) => t.kill());
    };
  }, []);

  /**
   * Proximity hover. Each label lifts and its pill fades in as the pointer
   * nears it, rather than snapping on at the boundary — the response starts
   * before the cursor arrives, which is what makes it read as considered
   * rather than as a state toggle.
   *
   * Rects are cached rather than measured per frame. The bar is fixed, so they
   * only change on resize or when it condenses.
   */
  useEffect(() => {
    if (isCoarsePointer() || prefersReducedMotion()) return;
    const root = bar.current;
    if (!root) return;

    // Values are eased in this loop rather than handed to gsap.quickTo:
    // quickTo drives `y` fine but silently no-ops on the `scale` shorthand,
    // which left the pill stuck at its resting size.
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-magnetic]")).map(
      (el) => ({
        el,
        label: el.querySelector<HTMLElement>("[data-label]")!,
        pill: el.querySelector<HTMLElement>("[data-pill]")!,
        rect: el.getBoundingClientRect(),
        eased: 0,
      })
    );
    if (!items.length) return;

    const measure = () => items.forEach((i) => (i.rect = i.el.getBoundingClientRect()));
    const settle = window.setTimeout(measure, 800); // after the condense transition
    window.addEventListener("resize", measure);

    let px = -9999;
    let py = -9999;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const RADIUS = 90; // how far out a label starts responding

    let raf = requestAnimationFrame(function tick() {
      raf = requestAnimationFrame(tick);
      for (const item of items) {
        const r = item.rect;
        const inside = px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
        let target: number;
        if (inside) {
          target = 1;
        } else {
          const dx = px - (r.left + r.width / 2);
          const dy = py - (r.top + r.height / 2);
          const edge = Math.max(0, Math.hypot(dx, dy) - r.height / 2);
          target = Math.max(0, 1 - edge / RADIUS);
          target *= target; // ease the falloff so distant labels stay put
        }

        // Exponential smoothing: fast enough to feel attached to the pointer,
        // slow enough that the label settles rather than snaps.
        item.eased += (target - item.eased) * 0.14;
        const t = item.eased < 0.001 ? 0 : item.eased;

        item.label.style.transform = `translateY(${(-3 * t).toFixed(2)}px)`;
        item.pill.style.opacity = (0.1 * t).toFixed(4);
        item.pill.style.transform = `scale(${(0.88 + 0.12 * t).toFixed(4)})`;
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onMove);
    };
  }, [condensed]);

  const tone = onDark ? "text-bone" : "text-charcoal";

  return (
    <header
      ref={bar}
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[padding,color] duration-700",
        condensed ? "py-3" : "py-5 md:py-7",
        tone,
      ].join(" ")}
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      {/* A short scrim keeps the bar legible where a section heading passes
          underneath it. Tinted to match whichever tone is active. */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[190%] bg-gradient-to-b via-40% to-transparent transition-opacity duration-700",
          onDark ? "from-ink/95 via-ink/70" : "from-bone/95 via-bone/70",
        ].join(" ")}
      />

      <nav className="relative mx-auto flex max-w-[1800px] items-center justify-between px-3 md:px-8">
        <NavLink href={onHome ? "#hero" : "/"} wide>
          {BRAND.name}
        </NavLink>

        <ul className="hidden items-center md:flex">
          {NAV.map((item) => (
            <li key={item.href}>
              {/* Section anchors only exist on the homepage, so prefix them
                  when the bar is rendered anywhere else. */}
              <NavLink href={item.href.startsWith("#") && !onHome ? `/${item.href}` : item.href}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center">
          {/* Dials straight from the bar; the email form stays under Enquire. */}
          <NavLink href={telHref()} label={`Call ${CONTACT.phone}`}>Contact</NavLink>
          <span aria-hidden="true" className="hidden h-3 w-px bg-current/20 md:block" />
          <NavLink href={onHome ? "#contact" : "/#contact"}>Enquire</NavLink>
        </div>
      </nav>
    </header>
  );
}

/**
 * The pill sits behind the label at `currentColor`, so it inherits whichever
 * tone the bar is in and needs no separate light and dark treatment.
 */
function NavLink({
  href,
  children,
  wide = false,
  label,
}: {
  href: string;
  children: React.ReactNode;
  wide?: boolean;
  /** Announced instead of the visible text, when they differ meaningfully. */
  label?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      data-magnetic
      className="relative block rounded-full px-4 py-2 outline-none focus-visible:ring-1 focus-visible:ring-current"
    >
      <span
        data-pill
        aria-hidden="true"
        className="absolute inset-0 origin-center rounded-full bg-current opacity-0"
        style={{ transform: "scale(0.88)" }}
      />
      <span
        data-label
        className={`relative block whitespace-nowrap eyebrow ${
          wide ? "tracking-[0.3em]" : "tracking-[0.2em]"
        }`}
      >
        {children}
      </span>
    </a>
  );
}
