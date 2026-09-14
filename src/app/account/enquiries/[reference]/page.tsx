import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { verifiedUser } from "@/lib/auth/session";
import { getEnquiry, STATUS } from "@/lib/account/enquiries";
import { tidyReference } from "@/lib/account/reference";
import { Fact, StatusTag } from "@/components/account/Panels";
import { longDate } from "@/lib/account/format";
import { CONTACT, telHref } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * One enquiry, in full.
 *
 * What was asked, what the piece was, where it has got to, and what happens
 * next — written as a short letter rather than a ticket. There is no message
 * box: the workshop replies by email, and pretending otherwise would leave
 * somebody typing into a room with nobody in it.
 */
export default async function EnquiryPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const user = await verifiedUser();
  if (!user) return null;

  const enquiry = await getEnquiry(user, tidyReference((await params).reference));
  if (!enquiry) notFound();

  const image = enquiry.product?.images[0];
  const status = STATUS[enquiry.status];

  return (
    <div>
      <Link
        href="/account/enquiries"
        className="eyebrow text-[0.7rem] text-charcoal/65 transition-colors duration-500 hover:text-charcoal"
      >
        ← All enquiries
      </Link>

      <header className="mt-8 border-b border-charcoal/12 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-tight text-charcoal">
              {enquiry.product?.name ?? enquiry.subject ?? "A visit to the showroom"}
            </h1>
            <p className="mt-3 text-[0.82rem] tracking-[0.14em] text-charcoal/65">
              {enquiry.reference}
            </p>
          </div>

          <StatusTag
            label={status.label}
            tone={
              enquiry.status === "RESOLVED"
                ? "settled"
                : enquiry.status === "CLOSED"
                  ? "neutral"
                  : "waiting"
            }
          />
        </div>

        <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-charcoal/75">
          {status.note}
        </p>
      </header>

      <div className="grid gap-12 pt-10 lg:grid-cols-[1fr_16rem] lg:gap-16">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="eyebrow text-[0.7rem] text-charcoal/65">What you wrote</h2>
            <p className="mt-5 whitespace-pre-line text-[1rem] leading-relaxed text-charcoal/80">
              {enquiry.message ?? "You asked us to arrange a time to visit the showroom."}
            </p>
            <p className="mt-5 text-[0.82rem] text-charcoal/65">
              Sent {longDate(enquiry.createdAt)} · to {enquiry.email}
            </p>
          </section>

          {enquiry.response && (
            <section className="border-l border-olive/40 pl-6">
              <h2 className="eyebrow text-[0.7rem] text-charcoal/65">Our reply</h2>
              <p className="mt-5 whitespace-pre-line text-[1rem] leading-relaxed text-charcoal/80">
                {enquiry.response}
              </p>
              {enquiry.respondedAt && (
                <p className="mt-5 text-[0.82rem] text-charcoal/65">
                  {longDate(enquiry.respondedAt)}
                </p>
              )}
            </section>
          )}

          <section className="border-t border-charcoal/10 pt-8">
            <h2 className="eyebrow text-[0.7rem] text-charcoal/65">What happens next</h2>
            <ol className="mt-6 space-y-5">
              {[
                ["01", "We read it and reply from the workshop, usually within two working days."],
                ["02", "If it needs a conversation, we suggest a time — in the showroom or by telephone."],
                ["03", "Nothing is committed until you say so. There is no appointment fee."],
              ].map(([n, line]) => (
                <li key={n} className="flex gap-5">
                  <span className="eyebrow shrink-0 pt-1 text-[0.68rem] text-charcoal/70">{n}</span>
                  <span className="text-[0.95rem] leading-relaxed text-charcoal/80">{line}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-charcoal/10 pt-8">
            <p className="text-[0.95rem] leading-relaxed text-charcoal/75">
              Something to add, or in a hurry? Reply to our email with this reference, or call{" "}
              <a
                href={telHref()}
                className="text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
              >
                {CONTACT.phone}
              </a>
              .
            </p>
          </section>
        </div>

        {enquiry.product && (
          <aside className="lg:pt-1">
            <Link href={`/collections/${enquiry.product.category.slug}/${enquiry.product.slug}`} className="group block">
              {image && (
                <div className="media-frame bg-transparent">
                  <Image
                    src={image.url}
                    alt={enquiry.product.name}
                    width={image.width}
                    height={image.height}
                    sizes="(max-width: 1024px) 60vw, 256px"
                    className="h-auto w-full transition-opacity duration-700 group-hover:opacity-85"
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  />
                </div>
              )}
              <p className="mt-4 font-display text-[1.05rem] text-charcoal">
                {enquiry.product.name}
              </p>
              <p className="eyebrow mt-2 text-[0.68rem] text-charcoal/65">
                {enquiry.product.category.title}
              </p>
            </Link>

            <dl className="mt-8 space-y-6 border-t border-charcoal/10 pt-6">
              <Fact label="Reference">{enquiry.reference}</Fact>
              <Fact label="Last updated">{longDate(enquiry.updatedAt)}</Fact>
              <Fact label="Lead time">Sixteen weeks from order</Fact>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}
