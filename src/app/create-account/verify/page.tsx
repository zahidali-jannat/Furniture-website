import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthShell from "@/components/account/AuthShell";
import VerifyFlow from "@/components/account/VerifyFlow";
import { prisma } from "@/lib/db";
import { verificationSubject } from "@/lib/auth/pending";
import { afterVerification } from "@/lib/auth/finish";
import { checkEmailLink } from "@/lib/auth/verification";
import { smsConfigured } from "@/lib/sms/sender";
import { configProblem as mailProblem } from "@/lib/email/mailer";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Confirm your details — ${BRAND.wordmark}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where a registration is finished.
 *
 * Two ways in. Usually the visitor arrives from the form with a pending ticket
 * in a cookie and types the codes. Sometimes they arrive from the emailed link
 * on a different device, carrying a token and no cookie — that still proves the
 * address, so it is honoured, and they are told to go back to the tab they
 * started in rather than being asked for a code they cannot supply here.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const linkUserId = token ? await checkEmailLink(token) : null;
  const subject = await verificationSubject();

  // The link was opened somewhere with no registration in progress.
  if (linkUserId && !subject) {
    return (
      <AuthShell
        eyebrow="Members"
        title="Address"
        italic="confirmed."
        intro="That is your email address proved. Go back to the tab where you started to confirm your phone number — or sign in, if you have finished already."
        image="/poster/shot-03-linear-pendant.jpg"
        caption="One step at a time."
      >
        <Link
          href="/login"
          className="eyebrow inline-block border border-charcoal px-8 py-4 text-[0.68rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
        >
          Sign in
        </Link>
      </AuthShell>
    );
  }

  if (!subject) redirect("/create-account");

  // If the link just completed the last outstanding proof, this issues the
  // session before anything renders. The incoming headers are passed through
  // so the session records the device that actually opened the link rather
  // than an anonymous placeholder.
  if (linkUserId) {
    await afterVerification(
      subject,
      new Request("https://verification.local/", { headers: await headers() })
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: subject.userId },
    select: { email: true, phone: true, emailVerifiedAt: true, phoneVerifiedAt: true },
  });

  if (!user) redirect("/create-account");

  if (user.emailVerifiedAt && user.phoneVerifiedAt) redirect("/account");

  // Said plainly rather than left as a silent dead end: if the server has no
  // mail or SMS credentials, no code was sent and no amount of waiting helps.
  const phoneUnavailable = !smsConfigured();

  const problem = {
    email: mailProblem()
      ? "Email is not configured on this server, so no message was sent. In development the message is written to .mail/ instead."
      : undefined,
    phone: phoneUnavailable
      ? "No SMS gateway is configured on this server, so no text can be sent. Your number is kept on file and can be confirmed from your account once one is set up."
      : undefined,
  };

  return (
    <AuthShell
      eyebrow="Members"
      title={phoneUnavailable ? "One small" : "Two small"}
      italic={phoneUnavailable ? "confirmation." : "confirmations."}
      intro={
        phoneUnavailable
          ? "A code is on its way to your inbox. We cannot text this server's codes yet, so your number is kept on file and confirmed later — the account opens once your address is confirmed."
          : "One code to your inbox, one to your phone. The account opens when both are in."
      }
      image="/poster/shot-03-linear-pendant.jpg"
      caption="Patience is the house style."
      footer={
        <p className="text-[0.8rem] text-charcoal/50">
          Wrong details?{" "}
          <Link
            href="/create-account"
            className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
          >
            Start again
          </Link>
          .
        </p>
      }
    >
      <VerifyFlow
        email={mask(user.email)}
        phone={user.phone ? maskPhone(user.phone) : null}
        initial={{
          emailVerified: Boolean(user.emailVerifiedAt),
          phoneVerified: Boolean(user.phoneVerifiedAt),
          phoneUnavailable,
          complete: false,
        }}
        deliveryProblem={problem}
      />
    </AuthShell>
  );
}

function mask(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 1)}${"•".repeat(Math.max(1, local.length - 2))}${
    local.length > 2 ? local.slice(-1) : ""
  }@${domain}`;
}

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)} ••• ${phone.slice(-2)}`;
}
