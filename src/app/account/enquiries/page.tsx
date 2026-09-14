import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { Empty } from "@/components/account/Panels";
import { QuietButton } from "@/components/account/Buttons";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  NEW: "With the workshop",
  ANSWERED: "Answered",
  CLOSED: "Closed",
};

/**
 * Enquiries sent from this address.
 *
 * Matched on the account id and on the verified address, so anything sent
 * before the account existed still appears — which is usually the first
 * enquiry, the one that brought them here.
 */
export default async function EnquiriesPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const enquiries = await prisma.enquiry.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      message: true,
      status: true,
      createdAt: true,
      product: { select: { slug: true, name: true, category: { select: { slug: true, title: true } } } },
    },
  });

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow text-[0.6rem] text-charcoal/40">Enquiries</p>
        <h1 className="display mt-6 text-[clamp(2.2rem,5vw,3.4rem)] leading-[0.98] text-charcoal">
          What you have
          <br />
          <em className="font-normal italic">asked us.</em>
        </h1>
        <p className="mt-6 max-w-lg text-[0.9rem] leading-relaxed text-charcoal/50">
          We reply within two working days. Everything is answered by the same three people.
        </p>
      </header>

      {enquiries.length === 0 ? (
        <Empty
          line="No enquiries yet. The showroom is open by appointment, Tuesday to Saturday."
          cta={
            <Link href="/#contact">
              <QuietButton type="button">Request a visit</QuietButton>
            </Link>
          }
        />
      ) : (
        <ul className="border-t border-charcoal/12">
          {enquiries.map((enquiry) => (
            <li
              key={enquiry.id}
              className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b border-charcoal/8 py-6"
            >
              <div className="min-w-0">
                <p className="text-[0.92rem] text-charcoal">
                  {enquiry.product ? (
                    <Link
                      href={`/collections/${enquiry.product.category.slug}/${enquiry.product.slug}`}
                      className="underline decoration-charcoal/20 underline-offset-4 transition-colors hover:decoration-charcoal"
                    >
                      {enquiry.product.name}
                    </Link>
                  ) : (
                    "A visit to the showroom"
                  )}
                </p>
                {enquiry.message && (
                  <p className="mt-2 max-w-xl text-[0.82rem] leading-relaxed text-charcoal/45">
                    {enquiry.message}
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-6">
                <span className="eyebrow text-[0.55rem] text-charcoal/35">
                  {enquiry.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
                <span className="text-[0.78rem] text-charcoal/55">
                  {STATUS[enquiry.status] ?? enquiry.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
