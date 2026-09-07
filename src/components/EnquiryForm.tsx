"use client";

import { useRef, useState } from "react";

type State =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string; note?: string };

export default function EnquiryForm() {
  const [state, setState] = useState<State>({ status: "idle" });
  const honeypot = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "sending") return;

    const email = new FormData(e.currentTarget).get("email");
    setState({ status: "sending" });

    try {
      const res = await fetch("/api/enquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: honeypot.current?.value ?? "" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState({
          status: "error",
          message: data.error ?? "Something went wrong. Please try again.",
          note: data.note,
        });
        return;
      }
      setState({ status: "sent" });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  if (state.status === "sent") {
    return (
      <div
        aria-live="polite"
        className="mt-12 w-full max-w-md border-t border-bone/30 pt-6 text-center"
      >
        <p className="font-display text-2xl text-bone">Check your inbox.</p>
        <p className="body-lg mt-3 text-bone/60">
          A confirmation is on its way. We reply within two working days.
        </p>
      </div>
    );
  }

  const sending = state.status === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-12 w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={sending}
          placeholder="you@example.com"
          aria-invalid={state.status === "error"}
          className="min-w-0 flex-1 border-b border-bone/30 bg-transparent px-1 py-3 text-bone placeholder:text-bone/35 focus:border-bone focus:outline-none disabled:opacity-50"
        />

        {/* Honeypot — off-screen rather than display:none, which some bots skip. */}
        <input
          ref={honeypot}
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        <button
          type="submit"
          disabled={sending}
          className="group relative overflow-hidden border border-bone/40 px-8 py-3 eyebrow text-bone transition-colors duration-700 hover:text-ink disabled:cursor-wait"
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        >
          <span className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100 group-disabled:scale-y-0" />
          <span className="relative whitespace-nowrap">
            {sending ? "Sending…" : "Request a visit"}
          </span>
        </button>
      </div>

      <div aria-live="polite" className="mt-4 min-h-[1.25rem] text-left">
        {state.status === "error" && (
          <>
            <p className="text-[0.8rem] text-clay">{state.message}</p>
            {state.note && (
              <p className="mt-1 text-[0.72rem] text-bone/40">{state.note}</p>
            )}
          </>
        )}
      </div>
    </form>
  );
}
