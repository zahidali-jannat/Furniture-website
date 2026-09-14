import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { DetailRow, Empty, Figure, Section, Verified } from "@/components/account/Panels";
import PhoneVerifyPanel from "@/components/account/PhoneVerifyPanel";
import { QuietButton } from "@/components/account/Buttons";
import { smsConfigured } from "@/lib/sms/sender";

export const dynamic = "force-dynamic";

/**
 * The overview.
 *
 * Three numbers, the details we hold, and the last few pieces they saved. The
 * data is read here on the server in one pass rather than fetched by the
 * browser after the page arrives: no spinner, no layout settling a second
 * later, and nothing about this account travels as JSON a cache could keep.
 */
export default async function AccountOverview({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await verifiedUser();
  if (!user) return null; // The layout has already redirected.

  const { welcome } = await searchParams;

  const [savedCount, enquiryCount, recent] = await Promise.all([
    prisma.savedProduct.count({ where: { userId: user.id } }),
    prisma.enquiry.count({ where: { OR: [{ userId: user.id }, { email: user.email }] } }),
    prisma.savedProduct.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        product: {
          select: {
            slug: true,
            name: true,
            category: { select: { slug: true, title: true } },
            images: { where: { primary: true }, take: 1, select: { url: true, width: true, height: true } },
          },
        },
      },
    }),
  ]);

  const firstName = user.fullName.trim().split(/\s+/)[0];

  return (
    <div className="space-y-16">
      <header>
        <p className="eyebrow text-[0.6rem] text-charcoal/40">Your account</p>

        <h1 className="display mt-6 text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.95] text-charcoal">
          {welcome ? (
            <>
              Your account
              <br />
              <em className="font-normal italic">is ready.</em>
            </>
          ) : (
            <>
              Welcome back,
              <br />
              <em className="font-normal italic">{firstName}.</em>
            </>
          )}
        </h1>

        <p className="mt-7 max-w-lg text-[0.95rem] leading-relaxed text-charcoal/55">
          {welcome
            ? "Feel free to explore our collection. Anything you save is kept here, and every enquiry you send arrives with the piece attached."
            : "Everything you have set aside, and everything you have asked us about, in one place."}
        </p>
      </header>

      {/* One rule above, none below: the section that follows draws its own,
          and two hairlines a gap apart read as an empty band. */}
      <div className="grid grid-cols-2 gap-y-10 border-t border-charcoal/12 pt-10 sm:grid-cols-3">
        <Figure value={savedCount} label="Pieces saved" href="/account/saved" />
        <Figure value={enquiryCount} label="Enquiries" href="/account/enquiries" />
        <Figure
          value={new Date(user.createdAt).getFullYear()}
          label="Member since"
        />
      </div>

      <Section
        title="Your details"
        action={
          <Link
            href="/account/settings"
            className="text-[0.75rem] text-charcoal/45 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
          >
            Edit
          </Link>
        }
      >
        <dl>
          <DetailRow label="Name" value={user.fullName} />
          <DetailRow
            label="Email"
            value={
              <span className="flex flex-wrap items-center gap-4">
                <span>{user.email}</span>
                <Verified yes />
              </span>
            }
          />
          <DetailRow
            label="Phone"
            value={
              user.phone ? (
                <span className="flex flex-wrap items-center gap-4">
                  <span>{user.phone}</span>
                  <Verified yes={Boolean(user.phoneVerifiedAt)} />
                </span>
              ) : (
                <span className="text-charcoal/40">Not added</span>
              )
            }
            action={
              user.phone && !user.phoneVerifiedAt ? null : user.phone ? null : (
                <Link
                  href="/account/settings"
                  className="text-[0.75rem] text-charcoal/45 underline-offset-4 hover:text-charcoal hover:underline"
                >
                  Add
                </Link>
              )
            }
          />
        </dl>

        {user.phone && !user.phoneVerifiedAt && (
          <div className="mt-8 border-l border-clay/40 pl-6">
            <p className="max-w-xl text-[0.85rem] leading-relaxed text-charcoal/55">
              {smsConfigured()
                ? "Your number is not confirmed yet. It is how we reach you about a piece being ready, so it is worth a minute."
                : "Your number is on file but not confirmed. We cannot send text messages from this server yet, so there is nothing to do — we will ask again once we can."}
            </p>
            <div className="mt-5">
              <PhoneVerifyPanel phone={user.phone} available={smsConfigured()} />
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Recently saved"
        action={
          savedCount > 0 ? (
            <Link
              href="/account/saved"
              className="text-[0.75rem] text-charcoal/45 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              See all {savedCount}
            </Link>
          ) : null
        }
      >
        {recent.length === 0 ? (
          <Empty
            line="Nothing saved yet."
            cta={
              <Link href="/collections">
                <QuietButton type="button">Explore the collection</QuietButton>
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-4">
            {recent.map(({ product }) => {
              const image = product.images[0];
              return (
                <li key={product.slug}>
                  <Link
                    href={`/collections/${product.category.slug}/${product.slug}`}
                    className="group block"
                  >
                    <div className="media-frame aspect-[4/5]">
                      {image && (
                        <Image
                          src={image.url}
                          alt={product.name}
                          width={image.width}
                          height={image.height}
                          sizes="(max-width: 640px) 45vw, 22vw"
                          className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.03]"
                          style={{ transitionTimingFunction: "var(--ease-lux)" }}
                        />
                      )}
                    </div>
                    <p className="mt-3 text-[0.85rem] text-charcoal">{product.name}</p>
                    <p className="eyebrow mt-1 text-[0.55rem] text-charcoal/35">
                      {product.category.title}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
