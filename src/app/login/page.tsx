import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/account/AuthShell";
import LoginForm from "@/components/account/LoginForm";
import { googleConfigured } from "@/lib/auth/config";
import { safeNext } from "@/lib/auth/validation";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Sign in — ${BRAND.wordmark}`,
  description: "Sign in to your account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow="Members"
      title="Welcome"
      italic="back."
      intro="Your saved pieces, your enquiries and the state of your account, kept where you left them."
      image="/poster/shot-06-modular-sofa.jpg"
      caption="Rooms remember the people who chose them."
      footer={
        <p className="text-[0.8rem] text-charcoal/50">
          No account yet?{" "}
          <Link
            href="/create-account"
            className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
          >
            Create one
          </Link>
          .
        </p>
      }
    >
      <LoginForm
        google={googleConfigured()}
        next={safeNext(params.next)}
        reason={params.reason}
      />
    </AuthShell>
  );
}
