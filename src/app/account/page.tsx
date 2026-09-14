import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { OPEN_STATUSES, STATUS } from "@/lib/account/enquiries";
import { kindLabel } from "@/lib/account/consultations";
import { smsConfigured } from "@/lib/sms/sender";
import { Empty, Fact, Section, StatusTag } from "@/components/account/Panels";
import PhoneVerifyPanel from "@/components/account/PhoneVerifyPanel";
import RecentlyViewed from "@/components/account/RecentlyViewed";
import { longDate } from "@/lib/account/format";

export const dynamic = "force-dynamic";

/**
 * The overview.
 *
 * What a member came back for, in the order they think of it: their name, what
 * is outstanding, what they saved, and one line about what happens next. The
 * figures are typography rather than tiles — three numerals on a rule, which is
 * how a gallery prints a catalogue count, not how a dashboard draws a KPI.
 *
 * Everything is read on the server in a single pass. No spinner, no waterfall,
 * and nothing about this account travels as JSON that a cache could keep.
 */
export default async function AccountOverview({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await verifiedUser();
  if (!user) return null; // The layout has already redirected.

  const { welcome } = await searchParams;
  const mine = { OR: [{ userId: user.id }, { email: user.email }] };

  const [savedCount, openEnquiries, recent, latestEnquiry, nextConsultation] = await Promise.all([
    prisma.savedProduct.count({ where: { userId: user.id } }),
    prisma.enquiry.count({ where: { ...mine, status: { in: OPEN_STATUSES } } }),
    prisma.savedProduct.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        product: {
          select: {
            slug: true,
            name: true,
            category: { select: { slug: true, title: true } },
            images: {
              where: { primary: true },
              take: 1,
              select: { url: true, width: true, height: true },
            },
          },
        },
      },
    }),
    prisma.enquiry.findFirst({
      where: mine,
      orderBy: { createdAt: "desc" },
      select: {
        reference: true,
        status: true,
        createdAt: true,
        subject: true,
        product: { select: { name: true } },
      },
    }),
    prisma.consultation.findFirst({
      where: { userId: user.id, status: { in: ["REQUESTED", "CONFIRMED"] } },
      orderBy: { requestedAt: "asc" },
      select: { reference: true, kind: true, status: true, requestedAt: true, confirmedAt: true },
    }),
  ]);

  const firstName = user.fullName.trim().split(/\s+/)[0];
  const nothingYet = savedCount === 0 && !latestEnquiry && !nextConsultation;

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow text-[0.72rem] text-charcoal/65">
          {welcome ? "Welcome" : "Your account"}
        </p>

        <h1 className="display mt-5 text-[clamp(2.3rem,5vw,3.6rem)] leading-[0.97] text-charcoal">
          {welcome ? (
            <>
              Your account
              <br />
              <em className="font-normal italic">is ready.</em>
            </>
          ) : (
            <>
              {firstName}
              <br />
              <em className="font-normal italic">— welcome back.</em>
            </>
          )}
        </h1>

        <p className="mt-6 max-w-xl text-[1rem] leading-relaxed text-charcoal/75">
          {welcome
            ? "Feel free to explore our collection. Anything you save is kept here, alongside your enquiries, your appointments and your details."
            : "Your saved pieces, enquiries, consultations and personal details."}
        </p>
      </header>

      {/* Three figures on a rule. One rule above and none below: the section
          that follows draws its own, and two hairlines a gap apart read as an
          empty band. */}
      <dl className="grid grid-cols-3 gap-6 border-t border-charcoal/12 pt-8">
        <Count value={savedCount} label="Saved pieces" href="/account/saved" />
        <Count value={openEnquiries} label="Open enquiries" href="/account/enquiries" />
        <Count
          value={nextConsultation ? 1 : 0}
          label="Consultations"
          href="/account/consultations"
        />
      </dl>

      <Section title="What would you like to do">
        <ul className="grid gap-x-10 gap-y-1 sm:grid-cols-2">
          <QuickAction href="/collections" label="Explore the collection" />
          <QuickAction href="/account/saved" label="Revisit your saved pieces" />
          <QuickAction href="/account/consultations#request" label="Arrange a consultation" />
          <QuickAction
            href={latestEnquiry ? `/account/enquiries/${latestEnquiry.reference}` : "/account/enquiries"}
            label={latestEnquiry ? "Continue your enquiry" : "Start an enquiry"}
          />
          <QuickAction href="/account/profile" label="Edit your details" />
          <QuickAction href="/account/security" label="Review your security" />
        </ul>
      </Section>

      {user.phone && !user.phoneVerifiedAt && (
        <Section title="One thing outstanding">
          <div className="border-l border-rust/40 pl-6">
            <p className="max-w-xl text-[0.95rem] leading-relaxed text-charcoal/75">
              {smsConfigured()
                ? "Your number is not confirmed yet. It is how we reach you about a piece being ready, so it is worth a minute."
                : "Your number is on file but not confirmed. We cannot send text messages from this server yet, so there is nothing to do — we will ask again once we can."}
            </p>
            <div className="mt-5">
              <PhoneVerifyPanel phone={user.phone} available={smsConfigured()} />
            </div>
          </div>
        </Section>
      )}

      <Section
        title="Recent activity"
        action={
          savedCount > 3 ? (
            <Link
              href="/account/saved"
              className="text-[0.85rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              All {savedCount} saved
            </Link>
          ) : null
        }
      >
        {nothingYet ? (
          <Empty
            line="Your personal furniture collection will appear here."
            cta={
              <Link
                href="/collections"
                className="eyebrow border border-charcoal/25 px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:border-charcoal"
              >
                Explore collections
              </Link>
            }
          />
        ) : (
          <div className="space-y-12">
            {recent.length > 0 && (
              <ul className="grid grid-cols-3 gap-5 sm:gap-8">
                {recent.map(({ product }) => {
                  const image = product.images[0];
                  return (
                    <li key={product.slug}>
                      <Link
                        href={`/collections/${product.category.slug}/${product.slug}`}
                        className="group block"
                      >
                        {/* The photograph at its own proportions — a piece of
                            furniture cropped to a square is a different piece
                            of furniture. */}
                        <div className="media-frame bg-transparent">
                          {image && (
                            <Image
                              src={image.url}
                              alt={product.name}
                              width={image.width}
                              height={image.height}
                              sizes="(max-width: 640px) 30vw, 180px"
                              className="h-auto w-full transition-opacity duration-700 group-hover:opacity-85"
                              style={{ transitionTimingFunction: "var(--ease-lux)" }}
                            />
                          )}
                        </div>
                        <p className="mt-3 truncate text-[0.95rem] text-charcoal">{product.name}</p>
                        <p className="eyebrow mt-1 text-[0.68rem] text-charcoal/65">
                          {product.category.title}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {(latestEnquiry || nextConsultation) && (
              <dl className="grid gap-8 border-t border-charcoal/8 pt-8 sm:grid-cols-2">
                {latestEnquiry && (
                  <Fact label="Latest enquiry">
                    <Link
                      href={`/account/enquiries/${latestEnquiry.reference}`}
                      className="underline decoration-charcoal/20 underline-offset-4 transition-colors hover:decoration-charcoal"
                    >
                      {latestEnquiry.product?.name ?? latestEnquiry.subject ?? "A visit to the showroom"}
                    </Link>
                    <span className="mt-2 block text-[0.85rem] text-charcoal/65">
                      {longDate(latestEnquiry.createdAt)} · {latestEnquiry.reference}
                    </span>
                    <span className="mt-2 block">
                      <StatusTag
                        label={STATUS[latestEnquiry.status].label}
                        tone={
                          latestEnquiry.status === "RESOLVED"
                            ? "settled"
                            : latestEnquiry.status === "CLOSED"
                              ? "neutral"
                              : "waiting"
                        }
                      />
                    </span>
                  </Fact>
                )}

                {nextConsultation && (
                  <Fact label="Next consultation">
                    <Link
                      href="/account/consultations"
                      className="underline decoration-charcoal/20 underline-offset-4 transition-colors hover:decoration-charcoal"
                    >
                      {kindLabel(nextConsultation.kind)}
                    </Link>
                    <span className="mt-2 block text-[0.85rem] text-charcoal/65">
                      {longDate(nextConsultation.confirmedAt ?? nextConsultation.requestedAt, true)}
                    </span>
                    <span className="mt-2 block">
                      <StatusTag
                        label={
                          nextConsultation.status === "CONFIRMED"
                            ? "Confirmed"
                            : "Awaiting confirmation"
                        }
                        tone={nextConsultation.status === "CONFIRMED" ? "settled" : "waiting"}
                      />
                    </span>
                  </Fact>
                )}
              </dl>
            )}
          </div>
        )}
      </Section>

      <RecentlyViewed />
    </div>
  );
}

function Count({ value, label, href }: { value: number; label: string; href: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <Link href={href} className="group block">
          <span className="display block text-[2.3rem] leading-none text-charcoal transition-opacity duration-500 group-hover:opacity-60">
            {value}
          </span>
          <span className="eyebrow mt-3 block text-[0.68rem] text-charcoal/65">{label}</span>
        </Link>
      </dd>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <li className="border-b border-charcoal/8 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0">
      <Link
        href={href}
        className="group flex items-center justify-between gap-4 py-3.5 text-[0.96rem] text-charcoal/85 transition-colors duration-500 hover:text-charcoal"
        style={{ transitionTimingFunction: "var(--ease-lux)" }}
      >
        {label}
        <span
          aria-hidden="true"
          className="block h-px w-6 origin-left bg-charcoal/25 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-10 group-hover:bg-charcoal"
        />
      </Link>
    </li>
  );
}
