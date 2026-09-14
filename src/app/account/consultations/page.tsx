import Link from "next/link";
import { verifiedUser } from "@/lib/auth/session";
import {
  KINDS,
  OPEN_FROM,
  OPEN_UNTIL,
  STATUS_LABEL,
  kindLabel,
  listConsultations,
} from "@/lib/account/consultations";
import { Empty, Fact, PageHeading, Section, StatusTag } from "@/components/account/Panels";
import ConsultationForm from "@/components/account/ConsultationForm";
import ConsultationActions from "@/components/account/ConsultationActions";
import { earliestSlot, longDate, weekday } from "@/lib/account/format";
import { CONTACT, telHref } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * Appointments.
 *
 * A timeline, not a calendar. Two rooms and a telephone do not need a month
 * grid — they need a list of what is coming, in the order it is coming, with
 * the two things a person actually does to an appointment: move it, or call it
 * off.
 */
export default async function ConsultationsPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const { upcoming, past } = await listConsultations(user.id);

  // The soonest the server will accept, handed to the date input so the
  // browser refuses an impossible time before the request is even made.
  const earliest = await earliestSlot();
  const hours = `Showroom time in Copenhagen — open by appointment, Tuesday to Saturday, ${OPEN_FROM} until ${OPEN_UNTIL - 12} in the evening. We confirm every time by email.`;

  return (
    <div>
      <PageHeading
        eyebrow="Consultations"
        title="Time with"
        italic="the studio."
        intro="An hour in the showroom, a conversation about a room, or a commission that does not exist yet. You ask for a time; we confirm it."
      />

      <div className="space-y-16">
        <Section
          title="Upcoming"
          action={
            <a
              href={telHref()}
              className="text-[0.85rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              {CONTACT.phone}
            </a>
          }
        >
          {upcoming.length === 0 ? (
            <Empty
              line="Your upcoming consultations will appear here."
              cta={
                <a
                  href="#request"
                  className="eyebrow inline-block border border-charcoal/25 px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:border-charcoal"
                >
                  Arrange one
                </a>
              }
            />
          ) : (
            <ol className="border-t border-charcoal/12">
              {upcoming.map((row) => {
                const when = row.confirmedAt ?? row.requestedAt;
                return (
                  <li key={row.reference} className="border-b border-charcoal/8 py-8">
                    <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                      <div className="min-w-0">
                        <p className="font-display text-[1.25rem] text-charcoal">
                          {kindLabel(row.kind)}
                        </p>
                        <p className="mt-2 text-[0.96rem] text-charcoal/85">
                          {weekday(when)}, {longDate(when, true)}
                        </p>
                        <p className="mt-1.5 text-[0.88rem] text-charcoal/65">
                          {row.minutes} minutes · {row.location ?? "The Copenhagen showroom"}
                          {row.consultant ? ` · with ${row.consultant}` : ""}
                        </p>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <StatusTag
                          label={STATUS_LABEL[row.status]}
                          tone={row.status === "CONFIRMED" ? "settled" : "waiting"}
                        />
                        <span className="text-[0.8rem] tracking-[0.12em] text-charcoal/70">
                          {row.reference}
                        </span>
                      </div>
                    </div>

                    {row.product && (
                      <p className="mt-4 text-[0.92rem] text-charcoal/75">
                        About{" "}
                        <Link
                          href={`/collections/${row.product.category.slug}/${row.product.slug}`}
                          className="underline decoration-charcoal/20 underline-offset-4 hover:decoration-charcoal"
                        >
                          {row.product.name}
                        </Link>
                      </p>
                    )}

                    {row.note && (
                      <p className="mt-4 max-w-xl whitespace-pre-line text-[0.95rem] leading-relaxed text-charcoal/75">
                        {row.note}
                      </p>
                    )}

                    {row.status === "REQUESTED" && (
                      <p className="mt-4 max-w-xl text-[0.88rem] leading-relaxed text-charcoal/65">
                        Asked for, not yet agreed. We confirm by email, usually within a working
                        day.
                      </p>
                    )}

                    <ConsultationActions reference={row.reference} earliest={earliest} />
                  </li>
                );
              })}
            </ol>
          )}
        </Section>

        <Section
          title="Arrange a consultation"
          description="Choose what it is for and a time that suits you. Nothing is charged for, and nothing is committed to."
        >
          <div id="request" className="scroll-mt-28">
            <ConsultationForm kinds={KINDS} earliest={earliest} hours={hours} />
          </div>
        </Section>

        {past.length > 0 && (
          <Section title="Past">
            <ul className="border-t border-charcoal/12">
              {past.map((row) => (
                <li
                  key={row.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-charcoal/8 py-5"
                >
                  <div>
                    <p className="text-[1rem] text-charcoal/85">{kindLabel(row.kind)}</p>
                    <p className="mt-1.5 text-[0.85rem] text-charcoal/65">
                      {longDate(row.confirmedAt ?? row.requestedAt, true)} · {row.reference}
                    </p>
                  </div>
                  <StatusTag
                    label={STATUS_LABEL[row.status]}
                    tone={row.status === "COMPLETED" ? "settled" : "neutral"}
                  />
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Before you come">
          <dl className="grid gap-8 sm:grid-cols-3">
            <Fact label="Where">
              The Copenhagen showroom, by appointment. Directions arrive with your confirmation.
            </Fact>
            <Fact label="Bring">
              Dimensions if you have them. A rough sketch on paper is more useful to us than a
              floor plan.
            </Fact>
            <Fact label="Cost">
              Nothing. There is no appointment fee and nothing to sign.
            </Fact>
          </dl>
        </Section>
      </div>
    </div>
  );
}
