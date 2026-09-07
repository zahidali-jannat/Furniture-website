"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster: string;
  className?: string;
  /** <1 slows the shot down. Slow reads as expensive. */
  rate?: number;
  /** Play once when it enters instead of looping forever. */
  once?: boolean;
};

/**
 * A muted autoplay loop that only decodes while it is on screen, and fetches
 * nothing until the element is near the viewport.
 */
export default function LoopVideo({ src, poster, className, rate = 1, once = false }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    let played = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (once && played) return;
          played = true;
          if (v.preload !== "auto") v.preload = "auto";
          if (once) v.currentTime = 0;
          v.playbackRate = rate;
          v.play().catch(() => {});
        } else if (!once) {
          v.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [rate, once]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      muted
      loop={!once}
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
