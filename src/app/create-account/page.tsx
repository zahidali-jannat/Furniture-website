import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/account/AuthShell";
import RegisterForm from "@/components/account/RegisterForm";
import { googleConfigured } from "@/lib/auth/config";
import { smsConfigured } from "@/lib/sms/sender";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Create an account — ${BRAND.wordmark}`,
  description: "Open an account to save pieces and keep your enquiries in one place.",
  robots: { index: false, follow: false },
};

export default function CreateAccountPage() {
  return (
    <AuthShell
      eyebrow="Members"
      title="Open an"
      italic="account."
      intro="Save the pieces you are thinking about, keep your enquiries together, and pick up where you left off."
      image="/poster/shot-02-boucle-chair.jpg"
      caption="Chosen slowly, kept for years."
      footer={
        <p className="text-[0.8rem] text-charcoal/50">
          Already a member?{" "}
          <Link
            href="/login"
            className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
          >
            Sign in
          </Link>
          .
        </p>
      }
    >
      <RegisterForm google={googleConfigured()} sms={smsConfigured()} />
    </AuthShell>
  );
}
