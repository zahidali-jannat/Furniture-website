import Image from "next/image";
import Link from "next/link";
import { verifiedUser } from "@/lib/auth/session";
import { getPreferences } from "@/lib/account/preferences";
import { smsConfigured } from "@/lib/sms/sender";
import { DetailRow, Fact, PageHeading, Section, Verified } from "@/components/account/Panels";
import ProfileForm from "@/components/account/ProfileForm";
import PhoneVerifyPanel from "@/components/account/PhoneVerifyPanel";
import { longDate } from "@/lib/account/format";

export const dynamic = "force-dynamic";

/**
 * Personal details.
 *
 * Split deliberately into three: what we hold and you can change, what we hold
 * and you cannot, and what is proven. The address sits in the middle group —
 * changing it is a change of identity and needs the new one proved before the
 * old one stops working, which is a flow of its own rather than a field in a
 * form. Saying that plainly is better than a disabled input with no reason.
 */
export default async function ProfilePage() {
  const user = await verifiedUser();
  if (!user) return null;

  const preferences = await getPreferences(user.id);

  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div>
      <PageHeading
        eyebrow="Profile"
        title="What we hold"
        italic="about you."
        intro="Used to answer you and to reach you about a piece. Nothing here is sold, shared or used for anything else."
      />

      <div className="space-y-16">
        <section className="flex items-center gap-6 border-y border-charcoal/12 py-8">
          {user.avatarUrl ? (
            // Supplied by Google when the account was linked. Shown at the size
            // it arrives at; never re-uploaded anywhere.
            <Image
              src={user.avatarUrl}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-charcoal/15 font-display text-[1.35rem] text-charcoal/85"
            >
              {initials || "M"}
            </span>
          )}

          <div className="min-w-0">
            <p className="font-display text-[1.4rem] leading-tight text-charcoal">
              {user.fullName}
            </p>
            <p className="mt-1.5 truncate text-[0.92rem] text-charcoal/70">{user.email}</p>
          </div>
        </section>

        <Section
          title="Details"
          description="Your name as we should write it, and the number we call about a delivery."
        >
          <ProfileForm fullName={user.fullName} email={user.email} phone={user.phone} />
        </Section>

        <Section title="Confirmed">
          <dl className="max-w-xl">
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
                  <span className="text-charcoal/65">Not added</span>
                )
              }
            />
          </dl>

          {user.phone && !user.phoneVerifiedAt && (
            <div className="mt-8 border-l border-rust/40 pl-6">
              <p className="max-w-xl text-[0.95rem] leading-relaxed text-charcoal/75">
                {smsConfigured()
                  ? "Confirming your number takes a minute and means we can reach you about a delivery."
                  : "We cannot send text messages from this server yet, so there is nothing to do — your number is on file and we will ask again once we can."}
              </p>
              <div className="mt-5">
                <PhoneVerifyPanel phone={user.phone} available={smsConfigured()} />
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Your account"
          action={
            <Link
              href="/account/preferences"
              className="text-[0.85rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              Communication preferences
            </Link>
          }
        >
          <dl className="grid gap-8 sm:grid-cols-3">
            <Fact label="Member since">{longDate(user.createdAt)}</Fact>
            <Fact label="Last signed in">
              {user.lastLoginAt ? longDate(user.lastLoginAt, true) : "This is your first visit"}
            </Fact>
            <Fact label="Preferred contact">
              {preferences.preferredChannel === "phone" ? "By telephone" : "By email"}
            </Fact>
          </dl>

          <p className="mt-8 max-w-xl text-[0.88rem] leading-relaxed text-charcoal/65">
            To change the address on an account, write to the workshop — we confirm the new one
            before the old one stops working.
          </p>
        </Section>
      </div>
    </div>
  );
}
