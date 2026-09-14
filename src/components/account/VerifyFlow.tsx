"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CodeInput from "./CodeInput";
import { FormNotice } from "./FormBits";
import { PrimaryButton } from "./Buttons";
import { get, post } from "@/lib/client/api";

type Channel = "email" | "phone";

type Status = {
  emailVerified: boolean;
  phoneVerified: boolean;
  complete: boolean;
  /** No SMS gateway on this server, so the phone code cannot be delivered. */
  phoneUnavailable?: boolean;
};

/**
 * The verification screen.
 *
 * Two proofs, taken in whichever order they arrive. The panel for the
 * outstanding one is open; the other is a line with a tick against it.
 *
 * The page also polls its own status every few seconds, which is what makes
 * the emailed link work properly: open it on a phone and this tab, still sitting
 * on the laptop, notices and moves on by itself. Without that, clicking the
 * link on one device leaves the other waiting for a code it will never type.
 *
 * Polling stops the moment both proofs are in, and when the tab is in the
 * background — there is no reason to keep a hidden tab talking to the server.
 */
export default function VerifyFlow({
  email,
  phone,
  initial,
  deliveryProblem,
}: {
  email: string;
  phone: string | null;
  initial: Status;
  /** Set when the server could not actually send. Said plainly, not hidden. */
  deliveryProblem?: { email?: string; phone?: string };
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);
  const [done, setDone] = useState(initial.complete);

  const finish = useCallback(() => {
    setDone(true);
    // The session cookie was set by the response that completed the second
    // proof, so anything the router cached for this visitor predates it.
    router.refresh();
    router.push("/account?welcome=1");
  }, [router]);

  useEffect(() => {
    if (done || (status.emailVerified && status.phoneVerified)) return;

    let stopped = false;

    async function check() {
      if (document.visibilityState !== "visible" || stopped) return;

      const result = await get<Status>("/api/auth/verify/status");
      if (stopped || !result.ok) return;

      setStatus({
        emailVerified: result.emailVerified,
        phoneVerified: result.phoneVerified,
        phoneUnavailable: result.phoneUnavailable,
        complete: result.complete,
      });

      if (result.complete) finish();
    }

    const timer = window.setInterval(check, 6000);
    document.addEventListener("visibilitychange", check);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [done, status.emailVerified, status.phoneVerified, finish]);

  function onVerified(next: Status) {
    setStatus(next);
    if (next.complete) finish();
  }

  return (
    <div className="space-y-10">
      <Panel
        channel="email"
        target={email}
        verified={status.emailVerified}
        open={!status.emailVerified}
        problem={deliveryProblem?.email}
        onVerified={onVerified}
      />

      <div className="h-px bg-charcoal/10" />

      <Panel
        channel="phone"
        target={phone ?? "your phone"}
        verified={status.phoneVerified}
        open={status.emailVerified && !status.phoneVerified}
        problem={deliveryProblem?.phone}
        unavailable={status.phoneUnavailable}
        onVerified={onVerified}
      />

      {done && (
        <p aria-live="polite" className="text-[0.9rem] text-moss">
          Both confirmed. Opening your account…
        </p>
      )}
    </div>
  );
}

function Panel({
  channel,
  target,
  verified,
  open,
  problem,
  unavailable = false,
  onVerified,
}: {
  channel: Channel;
  target: string;
  verified: boolean;
  open: boolean;
  problem?: string;
  /** This server cannot send on this channel at all. */
  unavailable?: boolean;
  onVerified: (status: Status) => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const submitted = useRef("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(
    async (value: string) => {
      // Autosubmit on the sixth digit can fire twice — once from the effect in
      // CodeInput, once from the button — so the same code is never sent twice.
      if (busy || submitted.current === value) return;
      submitted.current = value;

      setBusy(true);
      setError(null);
      setSent(null);

      const result = await post<Status>(`/api/auth/verify/${channel}`, { code: value });
      setBusy(false);

      if (!result.ok) {
        setError(result.error);
        setCode("");
        submitted.current = "";
        return;
      }

      onVerified({
        emailVerified: result.emailVerified,
        phoneVerified: result.phoneVerified,
        complete: result.complete,
      });
    },
    [busy, channel, onVerified]
  );

  async function resend() {
    if (cooldown > 0 || busy) return;

    setBusy(true);
    setError(null);

    const result = await post<{ sent: boolean; dev?: { code?: string } }>(
      "/api/auth/verify/resend",
      { channel }
    );
    setBusy(false);
    setCooldown(60);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Outside production the server hands back the code it could not deliver,
    // rather than leaving whoever is building this to go digging in .sms/ for
    // it. It is never present in a production response.
    setDevCode(result.dev?.code ?? null);

    setSent(
      result.sent
        ? channel === "email"
          ? "A new code is on its way to your inbox."
          : "A new code is on its way to your phone."
        : "We could not send that message. See the note below."
    );
  }

  const heading = channel === "email" ? "Email address" : "Phone number";

  if (verified) {
    return (
      <div className="flex items-baseline justify-between gap-6">
        <div>
          <p className="eyebrow text-[0.72rem] text-charcoal/65">{heading}</p>
          <p className="mt-2 text-[1rem] text-charcoal/85">{target}</p>
        </div>
        <p className="flex items-center gap-2 text-[0.85rem] text-moss">
          <span aria-hidden="true" className="h-1 w-1 rounded-full bg-olive" />
          Confirmed
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-baseline justify-between gap-6 opacity-45">
        <div>
          <p className="eyebrow text-[0.72rem] text-charcoal/65">{heading}</p>
          <p className="mt-2 text-[1rem] text-charcoal/85">{target}</p>
        </div>
        {/* Two codes were promised at the top of the page. If one of them
            cannot be sent, say so here rather than leaving a step queued that
            is never going to arrive. */}
        <p className="max-w-[13rem] text-right text-[0.85rem] leading-snug text-charcoal/75">
          {unavailable ? "Saved — we will confirm it later" : "Next"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-6">
        <p className="eyebrow text-[0.72rem] text-charcoal/65">{heading}</p>
        <p className="text-[0.88rem] text-charcoal/75">{target}</p>
      </div>

      <p className="mt-4 text-[0.95rem] leading-relaxed text-charcoal/75">
        {channel === "email"
          ? "Type the six digits we sent, or open the link in the message."
          : "Type the six digits we sent by text message."}
      </p>

      <div className="mt-6">
        <CodeInput
          label={`${heading} verification code`}
          value={code}
          onChange={setCode}
          onComplete={submit}
          disabled={busy}
          invalid={Boolean(error)}
        />
      </div>

      <div className="mt-5">
        <FormNotice error={error} success={sent} />
      </div>

      {problem && (
        <p className="mt-2 border-l border-rust/40 pl-3 text-[0.82rem] leading-relaxed text-charcoal/70">
          {problem}
        </p>
      )}

      {/* Development only — the server returns the code it could not send, so
          the flow can be finished on a machine with no gateway configured. */}
      {devCode && (
        <p className="mt-3 border-l border-olive/50 pl-3 text-[0.82rem] leading-relaxed text-charcoal/75">
          Development: nothing was sent, so here is the code —{" "}
          <span className="tracking-[0.3em] text-charcoal">{devCode}</span>
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-6">
        <div className="w-full sm:w-48">
          <PrimaryButton
            type="button"
            onClick={() => submit(code)}
            busy={busy}
            busyLabel="Checking…"
            disabled={code.length !== 6}
          >
            Confirm
          </PrimaryButton>
        </div>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || busy}
          className="text-[0.85rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline disabled:no-underline disabled:hover:text-charcoal/70"
        >
          {cooldown > 0 ? `Send another in ${cooldown}s` : "Send another code"}
        </button>
      </div>
    </div>
  );
}
