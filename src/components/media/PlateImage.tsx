"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import { gsap, EASE, prefersReducedMotion } from "@/lib/gsap";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  /** Ceiling on the rendered height. Width follows from the real proportions. */
  maxH?: string;
  className?: string;
  priority?: boolean;
  /** Wraps in a link-friendly group hover treatment. */
  interactive?: boolean;
};

/**
 * An image shown whole.
 *
 * The element carries its intrinsic width and height and is constrained by
 * `max-width` and `max-height` only, so the browser scales it on its own
 * proportions. Nothing is cropped, and because the box is the image rather than
 * a frame the image sits in, there are no letterbox bars either — the usual
 * cost of `object-fit: contain`.
 *
 * Two things this rules out, both by definition rather than by choice:
 *
 * - Parallax drift. It works by oversizing the image inside a clipped frame and
 *   sliding it; with the whole image visible there is nothing to slide into.
 * - Hover zoom above 1. Scaling up past the box would push the edges out of
 *   view, which is cropping by another name.
 *
 * So entrance is a wipe that finishes fully open, and hover lifts and brightens
 * instead of magnifying.
 */
export default function PlateImage({
  src,
  alt,
  width,
  height,
  sizes,
  maxH = "max-h-[70svh]",
  className = "",
  priority = false,
  interactive = false,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".plate-inner",
        { clipPath: "inset(100% 0% 0% 0%)", scale: 0.985 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 1.7,
          ease: EASE,
          scrollTrigger: { trigger: wrap.current, start: "top 88%" },
        }
      );
    }, wrap);
    return () => ctx.revert();
  }, []);

  return (
    // items-center is load-bearing: a flex parent defaults to align-items:
    // stretch, which overrides height:auto on the image and distorts it to the
    // container height. Centring keeps the intrinsic proportions.
    <div ref={wrap} className={`flex w-full items-center justify-center ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        // h-auto/w-auto keep the aspect the browser derives from the intrinsic
        // size; the two maxima are the only things that constrain it.
        className={[
          "plate-inner block h-auto w-auto max-w-full origin-center",
          maxH,
          interactive
            ? "transition-[transform,filter] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:brightness-[1.04]"
            : "",
        ].join(" ")}
      />
    </div>
  );
}
