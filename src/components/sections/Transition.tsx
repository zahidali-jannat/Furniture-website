"use client";

import LoopVideo from "@/components/media/LoopVideo";
import { RevealText } from "@/components/Reveal";
import { shot } from "@/lib/shots";

/**
 * Shot 04 pushes past foliage in the foreground, so it works as a curtain
 * between chapters. It plays once on entry rather than looping — a loop would
 * draw attention to a beat that is meant to pass.
 */
export default function Transition() {
  const s = shot("foliage-reveal");

  return (
    <section
      data-nav="dark"
      className="relative h-[78svh] w-full overflow-hidden bg-ink md:h-[92svh]"
    >
      <LoopVideo
        src={s.src}
        poster={s.poster}
        rate={0.5}
        once
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/15 to-ink/80" />

      <div className="relative mx-auto flex h-full max-w-[1800px] items-end px-5 pb-[10vh] md:px-10">
        <RevealText
          lines={["Light is the", "second material."]}
          className="display max-w-[16ch] text-[clamp(2rem,4.6vw,4.2rem)] text-bone"
          italicLast
          start="top 78%"
        />
      </div>
    </section>
  );
}
