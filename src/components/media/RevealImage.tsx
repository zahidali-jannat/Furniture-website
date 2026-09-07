"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  src: string;
  alt: string;
  /** Wrapper classes — set the aspect ratio and size here. */
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Vertical drift in percent across the whole scroll pass. 0 disables it. */
  parallax?: number;
  /** Starting zoom, eased back to 1 as the image travels. */
  zoom?: number;
  /** "up" wipes from the bottom edge; "down" from the top. */
  from?: "up" | "down";
};

/**
 * An image that wipes up into view once, then drifts against the scroll.
 * The wipe and the drift are separate tweens so the parallax stays linear.
 */
export default function RevealImage({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
  parallax = 7,
  zoom = 1.12,
  from = "up",
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrap.current,
        { clipPath: from === "down" ? "inset(0% 0% 100% 0%)" : "inset(100% 0% 0% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.7,
          ease: EASE,
          scrollTrigger: { trigger: wrap.current, start: "top 86%" },
        }
      );

      if (parallax !== 0) {
        gsap.fromTo(
          ".ri-inner",
          { yPercent: -parallax, scale: zoom },
          {
            yPercent: parallax,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: wrap.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      }
    }, wrap);
    return () => ctx.revert();
  }, [parallax, zoom, from]);

  return (
    <div ref={wrap} className={`media-frame ${className}`}>
      <div className="ri-inner absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    </div>
  );
}
