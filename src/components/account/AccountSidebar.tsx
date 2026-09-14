"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

export type Section = {
  href: string;
  label: string;
  /** Shown as a quiet numeral beside the label when there is something to see. */
  count?: number;
};

/**
 * The portal's navigation.
 *
 * A column of words against a hairline on desktop, a scrollable row on a
 * phone — no icons, no pills, no highlighted block. A luxury brand's private
 * area is a page in a book, not a control panel, and the only thing marking
 * where you are is a short rule and the weight of the type.
 *
 * Sections the site cannot honestly fill are not in the list at all. An empty
 * "Orders" that has never held an order is a promise the brand has not made.
 */
export default function AccountSidebar({
  sections,
  name,
  email,
  initials,
}: {
  sections: Section[];
  name: string;
  email: string;
  initials: string;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/account" ? pathname === "/account" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop: a quiet column that stays put while the page moves. */}
      <nav
        aria-label="Account"
        className="sticky top-28 hidden self-start lg:block"
      >
        <div className="flex items-center gap-3.5 pb-8">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-charcoal/15 font-display text-[0.95rem] text-charcoal/85"
          >
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.96rem] text-charcoal">{name}</span>
            <span className="block truncate text-[0.82rem] text-charcoal/65">{email}</span>
          </span>
        </div>

        <ul className="border-t border-charcoal/10 pt-2">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive(section.href) ? "page" : undefined}
                className="group flex items-baseline justify-between gap-3 py-2.5 outline-none"
              >
                <span className="relative">
                  <span
                    className={[
                      "text-[0.96rem] transition-colors duration-500",
                      isActive(section.href)
                        ? "text-charcoal"
                        : "text-charcoal/70 group-hover:text-charcoal/80 group-focus-visible:text-charcoal",
                    ].join(" ")}
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  >
                    {section.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute -bottom-0.5 left-0 h-px w-full origin-left bg-charcoal transition-transform duration-700",
                      isActive(section.href)
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100",
                    ].join(" ")}
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  />
                </span>

                {section.count ? (
                  <span className="text-[0.8rem] tabular-nums text-charcoal/70">
                    {section.count}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-charcoal/10 pt-6">
          <SignOutButton className="text-[0.88rem] text-charcoal/65 underline-offset-4 transition-colors duration-500 hover:text-charcoal hover:underline" />
        </div>
      </nav>

      {/* Phone and tablet: the same list, laid on its side. Scrollable rather
          than wrapped, so the row height never changes as sections appear. */}
      <nav
        aria-label="Account"
        className="-mx-6 border-b border-charcoal/10 px-6 lg:hidden"
      >
        <ul className="flex gap-6 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <li key={section.href} className="shrink-0">
              <Link
                href={section.href}
                aria-current={isActive(section.href) ? "page" : undefined}
                className={[
                  "relative block whitespace-nowrap py-1 text-[0.92rem] transition-colors duration-500",
                  isActive(section.href) ? "text-charcoal" : "text-charcoal/65",
                ].join(" ")}
              >
                {section.label}
                {section.count ? (
                  <span className="ml-1.5 text-[0.75rem] tabular-nums text-charcoal/70">
                    {section.count}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute -bottom-[13px] left-0 h-px w-full origin-left bg-charcoal transition-transform duration-700",
                    isActive(section.href) ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                  style={{ transitionTimingFunction: "var(--ease-lux)" }}
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
