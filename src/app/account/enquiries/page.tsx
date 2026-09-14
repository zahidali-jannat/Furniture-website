import Link from "next/link";
import { verifiedUser } from "@/lib/auth/session";
import { listEnquiries, STATUS } from "@/lib/account/enquiries";
import { Empty, PageHeading, StatusTag } from "@/components/account/Panels";
import { longDate } from "@/lib/account/format";

export const dynamic = "force-dynamic";

/**
 * Enquiries, as a ledger.
 *
 * One line each: the piece, when it was sent, where it has got to. The
 * reference is set small and monospaced-by-letterspacing rather than in a
 * badge, because it is something you read out on the telephone, not a label.
 */
export default async function EnquiriesPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const enquiries = await listEnquiries(user);

  return (
    <div>
      <PageHeading
        eyebrow="Enquiries"
        title="What you have"
        italic="asked us."
        intro="We reply within two working days, and everything is answered by the same three people."
      />

      {enquiries.length === 0 ? (
        <Empty
          line="You have not submitted any enquiries yet."
          cta={
            <div className="space-y-6">
              <p className="mx-auto max-w-sm text-[0.92rem] leading-relaxed text-charcoal/65">
                Ask about a piece from its page, or from anything you have saved, and the
                conversation will be kept here.
              </p>
              <Link
                href="/account/saved"
                className="eyebrow inline-block border border-charcoal/25 px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:border-charcoal"
              >
                Your saved pieces
              </Link>
            </div>
          }
        />
      ) : (
        <ul className="border-t border-charcoal/12">
          {enquiries.map((enquiry) => (
            <li key={enquiry.reference} className="border-b border-charcoal/8">
              <Link
                href={`/account/enquiries/${enquiry.reference}`}
                className="group flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 py-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.1rem] text-charcoal transition-opacity duration-500 group-hover:opacity-65">
                    {enquiry.product?.name ?? enquiry.subject ?? "A visit to the showroom"}
                  </p>
                  {enquiry.message && (
                    <p className="mt-2 line-clamp-2 max-w-xl text-[0.92rem] leading-relaxed text-charcoal/70">
                      {enquiry.message}
                    </p>
                  )}
                  <p className="mt-3 text-[0.8rem] tracking-[0.12em] text-charcoal/70">
                    {enquiry.reference}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                  <StatusTag
                    label={STATUS[enquiry.status].label}
                    tone={
                      enquiry.status === "RESOLVED"
                        ? "settled"
                        : enquiry.status === "CLOSED"
                          ? "neutral"
                          : "waiting"
                    }
                  />
                  <span className="text-[0.82rem] text-charcoal/65">
                    {longDate(enquiry.createdAt)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
