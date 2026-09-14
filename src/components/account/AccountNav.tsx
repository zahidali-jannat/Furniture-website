"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/saved", label: "Saved" },
  { href: "/account/enquiries", label: "Enquiries" },
  { href: "/account/settings", label: "Settings" },
];

/**
 * The account's own navigation.
 *
 * A row of words with a rule under the current one. No sidebar, no icons, no
 * coloured pill: this is four pages, and anything more elaborate would be
 * decoration pretending to be structure.
 */
export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      <ul className="-mx-1 flex items-center gap-1 overflow-x-auto sm:gap-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={[
                  // Tighter on a narrow screen so all four labels fit at 390px
                  // rather than the last one sliding off the edge.
                  "relative block whitespace-nowrap px-2 py-2 eyebrow text-[0.58rem] tracking-[0.18em] transition-colors duration-500",
                  "sm:px-3 sm:text-[0.63rem] sm:tracking-[0.26em]",
                  active ? "text-charcoal" : "text-charcoal/40 hover:text-charcoal/75",
                ].join(" ")}
                style={{ transitionTimingFunction: "var(--ease-lux)" }}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={[
                    "absolute inset-x-2 -bottom-px h-px origin-left bg-charcoal transition-transform duration-700 sm:inset-x-3",
                    active ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                  style={{ transitionTimingFunction: "var(--ease-lux)" }}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
