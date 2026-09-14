"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormNotice } from "./FormBits";
import { del, patch } from "@/lib/client/api";

/**
 * Moving or cancelling an appointment.
 *
 * Both are two deliberate steps rather than one click: an appointment somebody
 * has arranged their afternoon around should not vanish because a thumb landed
 * on the wrong row. Moving a confirmed time puts it back to "awaiting
 * confirmation", which is the truth — the studio has not agreed to the new one
 * yet.
 */
export default function ConsultationActions({
  reference,
  earliest,
}: {
  reference: string;
  earliest: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "move" | "cancel">("idle");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await patch(`/api/account/consultations/${reference}`, { when });
    setBusy(false);

    if (!result.ok) {
      setError(result.fields?.when ?? result.error);
      return;
    }

    setMode("idle");
    router.refresh();
  }

  async function cancel() {
    if (busy) return;
    setBusy(true);
    setError(null);

    const result = await del(`/api/account/consultations/${reference}`);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMode("idle");
    router.refresh();
  }

  if (mode === "move") {
    return (
      <form onSubmit={move} className="mt-5 border-l border-charcoal/15 pl-5">
        <label
          htmlFor={`when-${reference}`}
          className="eyebrow block text-[0.68rem] text-charcoal/65"
        >
          New day and time
        </label>
        <p className="mt-1.5 text-[0.8rem] text-charcoal/65">Showroom time, Copenhagen.</p>
        <input
          id={`when-${reference}`}
          type="datetime-local"
          value={when}
          min={earliest}
          onChange={(event) => setWhen(event.target.value)}
          required
          disabled={busy}
          className="mt-3 w-full max-w-xs border-b border-charcoal/20 bg-transparent pb-2 text-[0.96rem] text-charcoal focus:border-charcoal focus:outline-none disabled:opacity-50"
        />

        <div className="mt-4">
          <FormNotice error={error} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-6">
          <button
            type="submit"
            disabled={busy}
            className="eyebrow border border-charcoal px-6 py-3 text-[0.72rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone disabled:opacity-50"
          >
            {busy ? "Asking…" : "Ask for this time"}
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            disabled={busy}
            className="text-[0.85rem] text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
          >
            Keep the current time
          </button>
        </div>
      </form>
    );
  }

  if (mode === "cancel") {
    return (
      <div className="mt-5 border-l border-rust/40 pl-5">
        <p className="text-[0.95rem] leading-relaxed text-charcoal/80">
          Cancel this appointment? You can ask for another whenever you like.
        </p>

        <div className="mt-4">
          <FormNotice error={error} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="eyebrow border border-rust px-6 py-3 text-[0.72rem] text-rust transition-colors duration-700 hover:bg-rust hover:text-bone disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Yes, cancel it"}
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            disabled={busy}
            className="text-[0.85rem] text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
          >
            Keep it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
      <button
        type="button"
        onClick={() => setMode("move")}
        className="text-[0.88rem] text-charcoal/80 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
      >
        Move it
      </button>
      <button
        type="button"
        onClick={() => setMode("cancel")}
        className="text-[0.88rem] text-charcoal/65 underline-offset-4 transition-colors hover:text-rust hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
