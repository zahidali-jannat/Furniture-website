import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountSidebar, { type Section } from "@/components/account/AccountSidebar";
import SignOutButton from "@/components/account/SignOutButton";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { OPEN_STATUSES } from "@/lib/account/enquiries";
import { BRAND, CONTACT, telHref } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Your account — ${BRAND.wordmark}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The private side of the house.
 *
 * A two-column reading layout: the navigation sits in the margin like a
 * contents page, and the content column is narrow enough to read. No cards, no
 * widgets, no coloured chrome — the same bone ground, hairlines and serif the
 * catalogue uses, because a member arriving here should not feel handed over
 * to a different company's software.
 *
 * The counts in the margin are read here, once, in one round trip, and passed
 * down. Every page under this layout is server-rendered from the session, so
 * nothing about a member is fetched by the browser or cached anywhere.
 *
 * Middleware has already turned away anyone without a session. This checks
 * again against the database, because middleware reads a token and a token can
 * outlive the account it describes by up to a quarter of an hour.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await verifiedUser();
  if (!user) redirect("/login?next=/account");

  const [saved, openEnquiries, upcoming] = await Promise.all([
    prisma.savedProduct.count({ where: { userId: user.id } }),
    prisma.enquiry.count({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
        status: { in: OPEN_STATUSES },
      },
    }),
    prisma.consultation.count({
      where: { userId: user.id, status: { in: ["REQUESTED", "CONFIRMED"] } },
    }),
  ]);

  /**
   * Only what this site can actually fill.
   *
   * Orders and Addresses are deliberately absent: there is no checkout and no
   * delivery to hold an address for, and a section that has never had anything
   * in it teaches people not to look at the others. The tables are ready when
   * the shop is — see ACCOUNTS.md.
   */
  const sections: Section[] = [
    { href: "/account", label: "Overview" },
    { href: "/account/profile", label: "Profile" },
    { href: "/account/saved", label: "Saved pieces", count: saved },
    { href: "/account/enquiries", label: "Enquiries", count: openEnquiries },
    { href: "/account/consultations", label: "Consultations", count: upcoming },
    { href: "/account/preferences", label: "Preferences" },
    { href: "/account/security", label: "Security" },
    { href: "/account/help", label: "Help & support" },
  ];

  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="min-h-dvh bg-bone">
      <header className="border-b border-charcoal/10">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-6 py-5 md:px-10">
          <Link
            href="/"
            className="eyebrow shrink-0 tracking-[0.3em] text-charcoal transition-opacity duration-500 hover:opacity-60"
          >
            {BRAND.name}
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/collections"
              className="hidden text-[0.88rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline sm:block"
            >
              The collection
            </Link>
            <span aria-hidden="true" className="hidden h-3 w-px bg-charcoal/15 sm:block" />
            <SignOutButton className="text-[0.88rem] text-charcoal/70 underline-offset-4 transition-colors duration-500 hover:text-charcoal hover:underline lg:hidden" />
            <span className="hidden text-[0.88rem] text-charcoal/70 lg:block">
              {user.fullName}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-6 pb-24 pt-8 md:px-10 md:pt-12">
        <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:gap-16 xl:gap-24">
          <AccountSidebar
            sections={sections}
            name={user.fullName}
            email={user.email}
            initials={initials || "M"}
          />

          {/* The reading column. Wide enough for a catalogue grid, narrow
              enough that a paragraph never runs past comfort. */}
          <main className="min-w-0 pt-10 lg:pt-0">{children}</main>
        </div>
      </div>

      <footer className="mx-auto max-w-[1280px] px-6 pb-16 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-charcoal/10 pt-7">
          <p className="text-[0.82rem] text-charcoal/65">
            {BRAND.established} · {BRAND.city}
          </p>
          <a
            href={telHref()}
            className="text-[0.82rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
          >
            {CONTACT.phone}
          </a>
        </div>
      </footer>
    </div>
  );
}
