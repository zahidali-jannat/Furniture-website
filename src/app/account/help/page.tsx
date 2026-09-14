import Link from "next/link";
import { PageHeading, Section } from "@/components/account/Panels";
import { BRAND, CONTACT, telHref } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * Help.
 *
 * Three ways to reach a person and honest answers to the questions the
 * workshop is actually asked. No ticket system, no chat bubble, no search box
 * over eleven articles — this is a business where the quickest route to an
 * answer is the telephone, and the page says so first.
 */

const QUESTIONS: { q: string; a: string }[] = [
  {
    q: "How long does a piece take?",
    a: "Sixteen weeks from order, for almost everything. Pieces are made in runs of forty and each one leaves the workshop with the name of the person who finished it.",
  },
  {
    q: "Can I see something before I commit?",
    a: "Yes, and we would rather you did. The showroom is open by appointment, Tuesday to Saturday, 10 until 6. There is no appointment fee and nothing to sign.",
  },
  {
    q: "Why is there no price on the site?",
    a: "Because almost nothing leaves here unchanged — a material, a dimension, a finish. We quote in writing once we know what the piece actually is.",
  },
  {
    q: "Do you deliver, and do you install?",
    a: "We deliver anywhere we can drive, and install anything that needs it. Both are quoted with the piece rather than added at the end.",
  },
  {
    q: "What happens to my details?",
    a: "They answer you and reach you about a delivery. Nothing is sold or shared, everything promotional stays off until you turn it on, and closing your account removes the lot.",
  },
  {
    q: "Can I change the address on my account?",
    a: "Write to us and we will move it. It is done by hand on purpose: the new address is confirmed before the old one stops working.",
  },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeading
        eyebrow="Help & support"
        title="Somebody"
        italic="will answer."
        intro="Three people run this workshop and all three read the post. The telephone is quickest."
      />

      <div className="space-y-16">
        <Section title="Reach us">
          <ul className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
            <Route
              href={telHref()}
              label="Call the workshop"
              detail={`${CONTACT.phone} · Tuesday to Saturday, 10 until 6`}
              external
            />
            <Route
              href="/account/enquiries"
              label="Follow an enquiry"
              detail="Quote the reference and we will find it"
            />
            <Route
              href="/account/consultations#request"
              label="Arrange a consultation"
              detail="Showroom, interiors, materials or a commission"
            />
            <Route
              href="/#contact"
              label="Write to us"
              detail="We reply within two working days"
            />
          </ul>
        </Section>

        <Section title="Questions we are asked">
          <dl className="border-t border-charcoal/12">
            {QUESTIONS.map((item) => (
              <div key={item.q} className="border-b border-charcoal/8 py-6">
                <dt className="font-display text-[1.1rem] text-charcoal">{item.q}</dt>
                <dd className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-charcoal/75">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="The small print">
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-charcoal/75">
            We hold your name, your address, your number and what you have saved or asked about —
            nothing else, and nothing you did not give us. It is used to answer you and for
            nothing more. You can close your account at any time from{" "}
            <Link
              href="/account/security"
              className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
            >
              Security
            </Link>
            , and doing so removes your details, your saved pieces and every device you are signed
            in on.
          </p>

          <p className="mt-6 max-w-2xl text-[0.88rem] leading-relaxed text-charcoal/65">
            {BRAND.wordmark} · {BRAND.established} · {BRAND.city}. Written terms accompany every
            quotation, and nothing is charged before you have one.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Route({
  href,
  label,
  detail,
  external = false,
}: {
  href: string;
  label: string;
  detail: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="block text-[1rem] text-charcoal transition-opacity duration-500 group-hover:opacity-65">
        {label}
      </span>
      <span className="mt-1.5 block text-[0.88rem] leading-relaxed text-charcoal/65">{detail}</span>
    </>
  );

  return (
    <li className="border-b border-charcoal/8 py-4 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      {external ? (
        <a href={href} className="group block">
          {inner}
        </a>
      ) : (
        <Link href={href} className="group block">
          {inner}
        </Link>
      )}
    </li>
  );
}
