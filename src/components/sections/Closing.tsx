"use client";

import { useRef } from "react";
import ScrollVideo from "@/components/media/ScrollVideo";
import { RevealText, Fade } from "@/components/Reveal";
import EnquiryForm from "@/components/EnquiryForm";
import ContactLink from "@/components/ContactLink";
import { shot } from "@/lib/shots";
import { CONTACT } from "@/lib/brand";

/**
 * Shot 07 is a pull-back that opens the whole room. Scroll drives it, so the
 * reader performs the reveal themselves as the invitation assembles over it.
 */
export default function Closing() {
  const root = useRef<HTMLElement>(null);
  const s = shot("penthouse-pullback");

  return (
    <section
      id="contact"
      data-nav="dark"
      ref={root}
      className="relative bg-ink text-bone"
    >
      <div className="h-[220vh]">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <ScrollVideo
            shot={s}
            triggerRef={root}
            start="top top"
            end="bottom bottom"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/25 to-ink/85" />

          <div className="relative mx-auto flex w-full max-w-[1800px] flex-col items-center px-5 text-center md:px-10">
            <Fade>
              <p className="eyebrow mb-8 text-bone/50">10 — Enquire</p>
            </Fade>

            <RevealText
              lines={["Come and sit", "in one."]}
              className="display text-[clamp(2.6rem,8vw,7.5rem)]"
              italicLast
              start="top 88%"
            />

            <Fade delay={0.1}>
              <p className="body-lg mt-8 max-w-[42ch] text-balance text-bone/70">
                The showroom is open by appointment, Tuesday to Saturday. Bring
                the dimensions of the room and we will do the rest.
              </p>
            </Fade>

            <Fade delay={0.15}>
              <EnquiryForm />
            </Fade>

            <Fade delay={0.2}>
              <div className="mt-10 flex flex-col items-center gap-3">
                <span className="eyebrow text-bone/35">or call the workshop</span>
                <ContactLink
                  className="group inline-flex items-center gap-3 font-display text-[clamp(1.5rem,3vw,2.4rem)] text-bone/85 transition-colors duration-700 hover:text-bone"
                >
                  <span aria-hidden="true" className="text-[0.55em] text-bone/40 transition-colors duration-700 group-hover:text-bone/70">
                    ✆
                  </span>
                  {CONTACT.phone}
                  <span className="block h-px w-0 bg-current transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-8" />
                </ContactLink>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </section>
  );
}
