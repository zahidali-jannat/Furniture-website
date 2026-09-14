"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "./Buttons";
import { FormNotice } from "./FormBits";
import { post } from "@/lib/client/api";

export type Kind = { value: string; label: string; blurb: string; minutes: number };

/**
 * Asking for a time.
 *
 * A short list of what the appointment is for, a day and a time, and a line
 * about the room if there is one. What comes back says "requested", not
 * "booked" — the studio confirms by hand, and a form that printed a
 * confirmation nobody had agreed to would be the one dishonest thing in the
 * whole account area.
 */
export default function ConsultationForm({
  kinds,
  earliest,
  hours,
}: {
  kinds: Kind[];
  /** The soonest datetime the server will accept, for the input's `min`. */
  earliest: string;
  hours: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState(kinds[0]?.value ?? "SHOWROOM");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await post<{ consultation: { reference: string } }>(
      "/api/account/consultations",
      {
        kind,
        when: form.get("when"),
        note: form.get("note") || undefined,
      }
    );

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    setDone(result.consultation.reference);
    router.refresh();
  }

  if (done) {
    return (
      <div aria-live="polite" className="border-l border-olive/50 pl-6">
        <p className="font-display text-[1.3rem] text-charcoal">Asked for.</p>
        <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-charcoal/75">
          We will confirm the time by email, usually within a working day. Nothing is fixed
          until we do — you will see it change above.
        </p>
        <p className="mt-3 text-[0.85rem] text-charcoal/65">
          Reference <span className="tracking-[0.12em] text-charcoal/85">{done}</span>
        </p>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="mt-5 text-[0.88rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
        >
          Ask for another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl">
      <fieldset>
        <legend className="eyebrow text-[0.7rem] text-charcoal/65">What for</legend>

        <ul className="mt-5 border-t border-charcoal/10">
          {kinds.map((option) => {
            const active = kind === option.value;
            return (
              <li key={option.value} className="border-b border-charcoal/8">
                <label
                  className={[
                    "flex cursor-pointer items-baseline gap-4 py-4 transition-opacity duration-500",
                    active ? "opacity-100" : "opacity-55 hover:opacity-85",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="kind"
                    value={option.value}
                    checked={active}
                    onChange={() => setKind(option.value)}
                    disabled={busy}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={[
                      "mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full border border-charcoal/40 transition-colors duration-500",
                      active ? "bg-charcoal" : "bg-transparent",
                    ].join(" ")}
                  />
                  <span className="min-w-0">
                    <span className="block text-[1rem] text-charcoal">{option.label}</span>
                    <span className="mt-1 block text-[0.9rem] leading-relaxed text-charcoal/70">
                      {option.blurb} · about {option.minutes} minutes
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <div className="mt-9">
        <label htmlFor="when" className="eyebrow block text-[0.7rem] text-charcoal/65">
          Day and time
        </label>
        <input
          id="when"
          name="when"
          type="datetime-local"
          required
          min={earliest}
          disabled={busy}
          aria-describedby="when-hours"
          className="mt-3 w-full max-w-xs border-b border-charcoal/20 bg-transparent pb-2.5 text-[1rem] text-charcoal focus:border-charcoal focus:outline-none disabled:opacity-50"
        />
        <p id="when-hours" className="mt-2 text-[0.82rem] leading-relaxed text-charcoal/65">
          {hours}
        </p>
        {fields.when && (
          <p role="alert" className="mt-2 text-[0.85rem] text-rust">
            {fields.when}
          </p>
        )}
      </div>

      <div className="mt-8">
        <label htmlFor="note" className="eyebrow block text-[0.7rem] text-charcoal/65">
          Anything we should know
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={1000}
          disabled={busy}
          placeholder="The room, its dimensions, the piece you have in mind."
          className="mt-3 w-full resize-y border-b border-charcoal/20 bg-transparent pb-2 text-[0.96rem] leading-relaxed text-charcoal placeholder:text-charcoal/60 focus:border-charcoal focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="mt-6">
        <FormNotice error={error} />
      </div>

      <div className="mt-4 w-52">
        <PrimaryButton type="submit" busy={busy} busyLabel="Asking…">
          Request this time
        </PrimaryButton>
      </div>
    </form>
  );
}
