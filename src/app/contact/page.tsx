import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import EnquiryForm from "@/components/EnquiryForm";
import ContactLink from "@/components/ContactLink";
import { Fade, RevealText } from "@/components/Reveal";
import { BRAND, CONTACT, telHref } from "@/lib/brand";
import { getChapters } from "@/lib/catalogue";
import { breadcrumbSchema, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact and appointments",
  description:
    "Write to the workshop or call the studio. The showroom is open by appointment, Tuesday to Saturday, and we reply to every enquiry within two working days.",
  path: "/contact",
  image: "/poster/shot-07-penthouse-pullback.jpg",
  imageAlt: `The ${BRAND.wordmark} showroom`,
});

/**
 * A page for the one thing this site asks people to do.
 *
 * Until now "contact" was an anchor two thousand pixels down the homepage:
 * nothing to link to from an email, nothing for somebody searching the brand's
 * name and the word "appointment", and no page a crawler could weigh on its
 * own. Everything here is already true elsewhere on the site — the number, the
 * hours, the two working days, the sixteen-week lead time — so nothing new is
 * claimed, it is simply gathered in the place people look for it.
 */
export default function ContactPage() {
  const chapters = getChapters();

  const trail = [
    { name: BRAND.wordmark, path: "/" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbSchema(trail))} />

      <section
        data-nav="dark"
        className="relative w-full bg-ink px-5 pb-[14vh] pt-[24vh] text-bone md:px-10 md:pt-[28vh]"
      >
        <div className="mx-auto max-w-[1800px]">
          <Fade>
            <nav aria-label="Breadcrumb" className="mb-12">
              <ol className="flex flex-wrap items-center gap-x-3 eyebrow text-bone/45">
                <li>
                  <Link href="/" className="transition-colors duration-500 hover:text-bone">
                    {BRAND.wordmark}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-bone">Contact</li>
              </ol>
            </nav>
          </Fade>

          <div className="grid grid-cols-1 gap-y-14 md:grid-cols-12 md:gap-x-10">
            <div className="md:col-span-7">
              <RevealText
                as="h1"
                lines={["Come and sit", "in one."]}
                className="display text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[1.02]"
                italicLast
              />

              <Fade delay={0.1}>
                <p className="body-lg mt-8 max-w-[46ch] text-bone/70">
                  The showroom is open by appointment, Tuesday to Saturday, 10 until 6. Bring the
                  dimensions of the room if you have them — a rough sketch on paper is more useful
                  to us than a floor plan.
                </p>
              </Fade>

              <Fade delay={0.15}>
                <EnquiryForm />
              </Fade>

              <Fade delay={0.2}>
                <p className="mt-10 text-[0.95rem] text-bone/55">
                  Or call the workshop directly on{" "}
                  <ContactLink className="text-bone underline decoration-bone/30 underline-offset-4 transition-colors hover:decoration-bone">
                    {CONTACT.phone}
                  </ContactLink>
                  .
                </p>
              </Fade>
            </div>

            <div className="md:col-span-4 md:col-start-9">
              <Fade delay={0.1}>
                <dl className="space-y-10">
                  <div>
                    <dt className="eyebrow text-bone/40">The showroom</dt>
                    <dd className="mt-3 text-[0.95rem] leading-relaxed text-bone/75">
                      {BRAND.city}. By appointment, Tuesday to Saturday, 10 until 6. There is no
                      appointment fee and nothing to sign.
                    </dd>
                  </div>

                  <div>
                    <dt className="eyebrow text-bone/40">By telephone</dt>
                    <dd className="mt-3 text-[0.95rem] leading-relaxed text-bone/75">
                      <a
                        href={telHref()}
                        className="underline decoration-bone/30 underline-offset-4 transition-colors hover:decoration-bone"
                      >
                        {CONTACT.phone}
                      </a>
                      <span className="mt-1 block text-bone/50">
                        The quickest route to an answer.
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="eyebrow text-bone/40">What happens next</dt>
                    <dd className="mt-3 text-[0.95rem] leading-relaxed text-bone/75">
                      We reply within two working days to arrange a time. If a piece is right, we
                      quote in writing — the lead time is sixteen weeks from order.
                    </dd>
                  </div>

                  <div>
                    <dt className="eyebrow text-bone/40">An account</dt>
                    <dd className="mt-3 text-[0.95rem] leading-relaxed text-bone/75">
                      Members can save pieces, follow an enquiry and arrange a consultation.{" "}
                      <Link
                        href="/login"
                        className="underline decoration-bone/30 underline-offset-4 transition-colors hover:decoration-bone"
                      >
                        Sign in
                      </Link>{" "}
                      or{" "}
                      <Link
                        href="/create-account"
                        className="underline decoration-bone/30 underline-offset-4 transition-colors hover:decoration-bone"
                      >
                        open one
                      </Link>
                      .
                    </dd>
                  </div>
                </dl>
              </Fade>
            </div>
          </div>

          {/* A way into the catalogue from the page people land on when they
              search the brand's name. */}
          <Fade>
            <nav aria-label="Furniture types" className="mt-[14vh] border-t border-bone/15 pt-8">
              <h2 className="eyebrow text-bone/40">What we make</h2>
              <ul className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                {chapters.map((chapter) => (
                  <li key={chapter.slug}>
                    <Link
                      href={`/collections/${chapter.slug}`}
                      className="font-display text-[clamp(1.4rem,3vw,2.4rem)] leading-none text-bone/55 transition-colors duration-700 hover:text-bone"
                      style={{ transitionTimingFunction: "var(--ease-lux)" }}
                    >
                      {chapter.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Fade>
        </div>
      </section>
    </SiteShell>
  );
}
