import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AccountNav from "@/components/account/AccountNav";
import SignOutButton from "@/components/account/SignOutButton";
import { verifiedUser } from "@/lib/auth/session";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Your account — ${BRAND.wordmark}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The private half of the site.
 *
 * A quiet bar, a rule, and a column of generous width — closer to the members'
 * page of a gallery than to a control panel. No sidebar, no cards with
 * shadows, no charts. What is here is what somebody actually came for: what
 * they saved, what they asked about, and what we hold about them.
 *
 * Middleware has already turned away anyone without a session. This checks
 * again against the database, because middleware reads a token and a token
 * can outlive the account it describes by up to a quarter of an hour.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await verifiedUser();
  if (!user) redirect("/login?next=/account");

  return (
    <div className="min-h-dvh bg-bone">
      <header className="sticky top-0 z-40 border-b border-charcoal/10 bg-bone/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-6 py-4 md:px-10">
          <Link
            href="/"
            className="eyebrow shrink-0 tracking-[0.3em] text-charcoal transition-opacity duration-500 hover:opacity-60"
          >
            {BRAND.name}
          </Link>

          <div className="hidden md:block">
            <AccountNav />
          </div>

          <div className="flex shrink-0 items-center gap-5">
            <span className="hidden text-[0.75rem] text-charcoal/40 lg:inline">
              {user.fullName}
            </span>
            <SignOutButton />
          </div>
        </div>

        <div className="border-t border-charcoal/8 px-4 py-1 md:hidden">
          <AccountNav />
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-6 py-14 md:px-10 md:py-20">{children}</main>

      <footer className="mx-auto max-w-[1180px] px-6 pb-16 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-charcoal/10 pt-7">
          <p className="text-[0.72rem] text-charcoal/35">
            {BRAND.established} · {BRAND.city}
          </p>
          <Link
            href="/collections"
            className="text-[0.72rem] text-charcoal/45 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
          >
            Back to the collection
          </Link>
        </div>
      </footer>
    </div>
  );
}
