"use client";

/**
 * The hero's entrance waits on the preloader so the two do not play over each
 * other. A timeout backs it up: if the preloader never mounts (reduced motion,
 * an error, a future page without it) the hero still animates.
 */
let resolve: (() => void) | undefined;

const ready: Promise<void> =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise<void>((r) => {
        resolve = r;
        window.setTimeout(r, 3000);
      });

export function markIntroDone() {
  resolve?.();
}

export function whenIntroDone() {
  return ready;
}
