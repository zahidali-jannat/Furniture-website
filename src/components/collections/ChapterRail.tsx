"use client";

import { useEffect, useState } from "react";

/**
 * A standing answer to "where am I, and what else is there".
 *
 * Progressive enhancement: the markup is a plain list of in-page links that
 * works with no JavaScript at all. The observer only adds emphasis to whichever
 * chapter is currently in view. Pointer devices on wide screens only — on a
 * phone it would take space the photographs need.
 */
export default function ChapterRail({
  chapters,
}: {
  chapters: { slug: string; title: string }[];
}) {
  const [active, setActive] = useState(chapters[0]?.slug ?? "");

  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(`chapter-${c.slug}`))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The chapter occupying the most of the viewport wins, so a tall
        // photograph scrolling past does not hand over too early.
        const best = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best) setActive(best.target.id.replace("chapter-", ""));
      },
      { threshold: [0.15, 0.35, 0.6], rootMargin: "-20% 0px -30% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [chapters]);

  return (
    <nav
      aria-label="Chapters"
      className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
    >
      <ol className="pointer-events-auto space-y-3 text-right">
        {chapters.map((c, i) => {
          const on = c.slug === active;
          return (
            <li key={c.slug}>
              <a
                href={`#chapter-${c.slug}`}
                aria-current={on ? "true" : undefined}
                className={[
                  "group flex items-center justify-end gap-3 eyebrow transition-colors duration-700",
                  on ? "text-charcoal" : "text-charcoal/25 hover:text-charcoal/60",
                ].join(" ")}
                style={{ transitionTimingFunction: "var(--ease-lux)" }}
              >
                <span>{c.title}</span>
                <span
                  aria-hidden="true"
                  className={[
                    "block h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    on ? "w-8 bg-charcoal" : "w-3 bg-charcoal/30 group-hover:w-5",
                  ].join(" ")}
                />
                <span className="w-5 text-charcoal/25">{String(i + 1).padStart(2, "0")}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
