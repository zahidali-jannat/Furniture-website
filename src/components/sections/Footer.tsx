"use client";

import Link from "next/link";
import { BRAND, CONTACT } from "@/lib/brand";
import ContactLink from "@/components/ContactLink";
import { Fade } from "@/components/Reveal";
import { getChapters, getRooms } from "@/lib/catalogue";

/**
 * The footer's links are the site's main crawl path, and they used to be
 * decoration: twelve labels — Journal, Stockists, Reupholstery, Terms — all
 * pointing at #contact, for pages that do not exist. A link that goes nowhere
 * it says it goes is a small lie told on every page of the site.
 *
 * They are now built from the catalogue, so the furniture types listed are the
 * ones the workshop actually photographs, and each goes to its own page.
 */
function columns() {
  const chapters = getChapters().slice(0, 5);
  const rooms = getRooms();

  return [
    {
      title: "Collection",
      links: chapters.map((c) => ({ label: c.title, href: `/collections/${c.slug}` })),
    },
    {
      title: "Maison",
      links: [
        { label: "The collection", href: "/collections" },
        ...(rooms ? [{ label: "Rooms", href: `/collections/${rooms.slug}` }] : []),
        { label: "Materials", href: "/#materials" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Members",
      links: [
        { label: "Your account", href: "/account" },
        { label: "Saved pieces", href: "/account/saved" },
        { label: "Consultations", href: "/account/consultations" },
        { label: "Sign in", href: "/login" },
      ],
    },
  ];
}

export default function Footer() {
  return (
    <footer data-nav="dark" className="relative overflow-hidden bg-ink text-bone">
      {/* Marquee: a slow, single-direction drift rather than a ticker. */}
      <div className="border-y border-bone/10 py-5">
        <div className="flex whitespace-nowrap [animation:marquee_38s_linear_infinite]">
          {[0, 1].map((dup) => (
            <span key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  <span className="eyebrow px-8 text-bone/45">{BRAND.city}</span>
                  <span className="h-1 w-1 rounded-full bg-bone/25" />
                  <span className="eyebrow px-8 text-bone/45">Runs of forty</span>
                  <span className="h-1 w-1 rounded-full bg-bone/25" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-5 py-16 md:px-10 md:py-24">
        <div className="grid grid-cols-2 gap-y-12 md:grid-cols-12 md:gap-x-10">
          <div className="col-span-2 md:col-span-4">
            <Fade>
              <p className="body-lg max-w-[28ch] text-bone/60">{BRAND.tagline}</p>
              <div className="mt-8 space-y-2">
                <p className="eyebrow text-bone/35">Contact</p>
                <ContactLink
                  className="group relative inline-block font-display text-xl text-bone/85 transition-colors duration-500 hover:text-bone"
                >
                  {CONTACT.phone}
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100" />
                </ContactLink>
              </div>
              <p className="eyebrow mt-8 text-bone/35">{BRAND.established}</p>
            </Fade>
          </div>

          {columns().map((col) => (
            <nav key={col.title} className="md:col-span-2 md:col-start-auto">
              <h3 className="eyebrow mb-5 text-bone/35">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group relative inline-block text-[0.9rem] text-bone/70 transition-colors duration-500 hover:text-bone"
                    >
                      {l.label}
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:origin-left group-hover:scale-x-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Oversized wordmark, cropped by the viewport edge on purpose. */}
        <div className="mt-20 md:mt-32">
          <p className="display select-none text-[clamp(3.4rem,15vw,15rem)] leading-[0.8] text-bone/90">
            {BRAND.wordmark}
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-bone/10 pt-6 text-[0.72rem] text-bone/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.wordmark}. All rights reserved.</p>
          <p>Imagery: project assets. Site built for demonstration.</p>
        </div>
      </div>

      <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
    </footer>
  );
}
