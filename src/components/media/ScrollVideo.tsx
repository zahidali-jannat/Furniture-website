"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, isCoarsePointer, prefersReducedMotion } from "@/lib/gsap";
import type { Shot } from "@/lib/shots";

type Props = {
  shot: Shot;
  className?: string;
  /** Element whose scroll progress drives playback. Defaults to the video's parent. */
  triggerRef?: React.RefObject<HTMLElement | null>;
  start?: string;
  end?: string;
};

/**
 * How quickly playback converges on the scroll position, per second. Higher is
 * tighter to the trackpad; lower drifts. This is the deliberate decoupling —
 * raw wheel input is jittery, and following it exactly is what reads as jank.
 */
const CONVERGENCE = 9;

/**
 * Maps scroll progress onto a frame of the clip.
 *
 * Three things keep this smooth, and all three matter:
 *
 * 1. Seeks are quantised to the clip's frame grid. Writing `currentTime` for a
 *    sub-frame delta decodes the same picture again for nothing, and at 60Hz
 *    that was most of the writes.
 * 2. Only one seek is ever in flight. A second request while the decoder is
 *    busy is held as `pending` and collapsed to the newest value, so a fast
 *    scroll issues one seek per decode rather than a queue that thrashes.
 * 3. Smoothing is frame-rate independent, so a 120Hz laptop and a 60Hz one
 *    converge over the same wall-clock time instead of the faster display
 *    tracking twice as tightly.
 *
 * Coarse pointers fall back to a plain autoplay loop: iOS Safari does not seek
 * reliably enough to scrub against.
 */
export default function ScrollVideo({ shot, className, triggerRef, start = "top bottom", end = "bottom top" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    if (prefersReducedMotion()) return; // poster frame only

    if (isCoarsePointer()) {
      v.loop = true;
      const io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            v.preload = "auto";
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        },
        { rootMargin: "150px 0px", threshold: 0.01 }
      );
      io.observe(v);
      return () => io.disconnect();
    }

    const trigger = triggerRef?.current ?? v.parentElement;
    if (!trigger) return;

    const frameCount = Math.max(1, Math.round(shot.duration * shot.fps) - 1);

    let targetP = 0;
    let easedP = 0;
    let ready = false;
    let visible = false;
    let raf = 0;
    let last = performance.now();

    let currentFrame = -1;
    let pendingFrame = -1;
    let seeking = false;

    const seekTo = (frame: number) => {
      if (frame === currentFrame) return;
      if (seeking) {
        pendingFrame = frame; // collapse to the newest request
        return;
      }
      currentFrame = frame;
      seeking = true;
      // Aim at the middle of the frame so rounding never lands on a boundary.
      v.currentTime = (frame + 0.5) / shot.fps;
    };

    const onSeeked = () => {
      seeking = false;
      if (pendingFrame >= 0) {
        const next = pendingFrame;
        pendingFrame = -1;
        seekTo(next);
      }
    };
    v.addEventListener("seeked", onSeeked);

    const onMeta = () => {
      ready = true;
      v.pause();
    };
    if (v.readyState >= 1) onMeta();
    else v.addEventListener("loadedmetadata", onMeta);

    const st = ScrollTrigger.create({
      trigger,
      start,
      end,
      onUpdate: (self) => {
        targetP = self.progress;
      },
    });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Exponential convergence, corrected for the real frame interval.
      easedP += (targetP - easedP) * (1 - Math.exp(-CONVERGENCE * dt));

      if (!ready || !visible) return;
      const frame = Math.round(Math.min(1, Math.max(0, easedP)) * frameCount);
      seekTo(frame);
    };

    // The loop only runs while the clip is on screen; off-screen sections cost
    // nothing. Buffering starts about a viewport out so it is ready on arrival.
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(tick);
        } else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "50% 0px", threshold: 0 }
    );
    io.observe(v);

    const buffer = new IntersectionObserver(
      ([e], obs) => {
        if (!e.isIntersecting) return;
        v.preload = "auto";
        v.load();
        obs.disconnect();
      },
      { rootMargin: "120% 0px" }
    );
    buffer.observe(v);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      buffer.disconnect();
      st.kill();
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [shot, triggerRef, start, end]);

  return (
    <video
      ref={ref}
      src={shot.src}
      poster={shot.poster}
      className={className}
      muted
      playsInline
      preload="none"
      aria-hidden="true"
      tabIndex={-1}
      // Promotes the element to its own compositor layer, so a seek repaints
      // the video and nothing else in the section.
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    />
  );
}
