import type { Metadata } from "next";
import Link from "next/link";
import AuthShell from "@/components/account/AuthShell";
import ForgotForm from "@/components/account/ForgotForm";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Forgotten password — ${BRAND.wordmark}`,
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Members"
      title="Forgotten"
      italic="it?"
      intro="It happens. Tell us the address on the account and we will send a link to set a new password."
      image="/poster/shot-04-foliage-reveal.jpg"
      caption="Nothing here is urgent."
      footer={
        <p className="text-[0.8rem] text-charcoal/50">
          Remembered it?{" "}
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
      <ForgotForm />
    </AuthShell>
  );
}
