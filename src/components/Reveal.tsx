"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

type RevealTextProps = {
  lines: string[];
  className?: string;
  /** Applied to every line; use for italics on a single line via `italicLast`. */
  lineClassName?: string;
  italicLast?: boolean;
  as?: "h1" | "h2" | "h3" | "p";
  start?: string;
};

/**
 * Lines rise into an overflow-clipped row. This is the site's one entrance
 * gesture for type — everything else is opacity and parallax.
 */
export function RevealText({
  lines,
  className = "",
  lineClassName = "",
  italicLast = false,
  as: Tag = "h2",
  start = "top 84%",
}: RevealTextProps) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(".rv-line", {
        yPercent: 112,
        duration: 1.4,
        ease: EASE,
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start },
      });
    }, root);
    return () => ctx.revert();
  }, [start]);

  return (
    // @ts-expect-error - polymorphic tag
    <Tag ref={root} className={className}>
      {lines.map((line, i) => (
        <span key={line + i} className="line-mask">
          <span
            className={`rv-line line-inner ${lineClassName}${
              italicLast && i === lines.length - 1 ? " italic" : ""
            }`}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

type FadeProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  start?: string;
};

export function Fade({ children, className = "", delay = 0, start = "top 88%" }: FadeProps) {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from(root.current, {
        opacity: 0,
        y: 18,
        duration: 1.2,
        ease: EASE,
        delay,
        scrollTrigger: { trigger: root.current, start },
      });
    }, root);
    return () => ctx.revert();
  }, [delay, start]);

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
