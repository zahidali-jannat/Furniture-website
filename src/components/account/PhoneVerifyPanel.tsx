"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodeInput from "./CodeInput";
import { PrimaryButton, QuietButton } from "./Buttons";
import { FormNotice } from "./FormBits";
import { post } from "@/lib/client/api";

/**
 * Confirming a phone number from inside the account.
 *
 * A number added or changed after registration is stored but not trusted, and
 * this is where it is proved. Nothing is gated behind it — the account works
 * either way — so it asks once, quietly, and can be left alone.
 */
export default function PhoneVerifyPanel({
  phone,
  available = true,
}: {
  phone: string;
  /** False when the server has no SMS gateway, so no code can be sent. */
  available?: boolean;
}) {
  const router = useRouter();
  const [asked, setAsked] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function send() {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError(null);
    setSent(null);

    const result = await post<{ sent: boolean; dev?: { code?: string } }>(
      "/api/auth/verify/resend",
      { channel: "phone" }
    );
    setBusy(false);
    setAsked(true);
    setCooldown(60);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Outside production the server returns the code it could not send.
    setDevCode(result.dev?.code ?? null);

    setSent(
      result.sent
        ? `A code is on its way to ${phone}.`
        : "No SMS gateway is configured on this server, so nothing was sent."
    );
  }

  async function confirm(value: string) {
    if (busy || value.length !== 6) return;
    setBusy(true);
    setError(null);

    const result = await post("/api/auth/verify/phone", { code: value });
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setCode("");
      return;
    }

    // The page is server-rendered from the session, so refreshing it is what
    // turns the row green.
    router.refresh();
  }

  if (!asked) {
    return (
      <div className="flex flex-wrap items-center gap-5">
        <QuietButton type="button" onClick={send} busy={busy}>
          Send a code
        </QuietButton>
        <p className="max-w-sm text-[0.78rem] leading-relaxed text-charcoal/40">
          {available
            ? `We text six digits to ${phone}.`
            : "Text messages are not set up on this server yet, so nothing will arrive. Your number is on file and can be confirmed once they are."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm">
      <CodeInput
        label="Phone verification code"
        value={code}
        onChange={setCode}
        onComplete={confirm}
        disabled={busy}
        invalid={Boolean(error)}
      />

      <div className="mt-5">
        <FormNotice error={error} success={sent} />
      </div>

      {devCode && (
        <p className="mt-3 border-l border-olive/50 pl-3 text-[0.72rem] leading-relaxed text-charcoal/55">
          Development: nothing was sent, so here is the code —{" "}
          <span className="tracking-[0.3em] text-charcoal">{devCode}</span>
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-6">
        <div className="w-40">
          <PrimaryButton
            type="button"
            onClick={() => confirm(code)}
            busy={busy}
            busyLabel="Checking…"
            disabled={code.length !== 6}
          >
            Confirm
          </PrimaryButton>
        </div>

        <button
          type="button"
          onClick={send}
          disabled={cooldown > 0 || busy}
          className="text-[0.75rem] text-charcoal/45 underline-offset-4 transition-colors hover:text-charcoal hover:underline disabled:no-underline disabled:hover:text-charcoal/45"
        >
          {cooldown > 0 ? `Send another in ${cooldown}s` : "Send another code"}
        </button>
      </div>
    </div>
  );
}
