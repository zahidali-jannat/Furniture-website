import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/account/AuthShell";
import ResetForm from "@/components/account/ResetForm";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Set a new password — ${BRAND.wordmark}`,
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // The token is not checked here. Whether it is live is the server's business
  // and answering it on a page load would make this a way to test tokens.
  if (!token) {
    return (
      <AuthShell
        eyebrow="Members"
        title="That link is"
        italic="incomplete."
        intro="Reset links expire after an hour and can be used once. Ask for a fresh one and it will be with you in a moment."
        image="/poster/shot-04-foliage-reveal.jpg"
        caption="Nothing here is urgent."
      >
        <Link
          href="/forgot-password"
          className="eyebrow inline-block border border-charcoal px-8 py-4 text-[0.68rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
        >
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Members"
      title="A new"
      italic="password."
      intro="Choose something long. A short phrase you will remember beats a short puzzle you will not."
      image="/poster/shot-04-foliage-reveal.jpg"
      caption="Nothing here is urgent."
      footer={
        <p className="text-[0.8rem] text-charcoal/50">
          Link expired?{" "}
          <Link
            href="/forgot-password"
            className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
          >
            Ask for another
          </Link>
          .
        </p>
      }
    >
      <ResetForm token={token} />
    </AuthShell>
  );
}
