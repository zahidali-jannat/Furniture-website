"use client";

import { useState } from "react";
import { PrimaryButton } from "./Buttons";
import { Field } from "./Field";
import { FormNotice, Honeypot } from "./FormBits";
import { post } from "@/lib/client/api";

/**
 * Asking for a reset link.
 *
 * The confirmation is worded the way the server behaves: *if* that address has
 * an account. The form cannot say more without becoming a way to find out who
 * holds one, and pretending otherwise would make the wording a lie rather than
 * a precaution.
 */
export default function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await post("/api/auth/password/forgot", {
      email: form.get("email"),
      company: form.get("company"),
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div aria-live="polite" className="border-t border-charcoal/12 pt-7">
        <p className="display text-[1.6rem] leading-tight text-charcoal">Check your inbox.</p>
        <p className="mt-3 text-[0.96rem] leading-relaxed text-charcoal/75">
          If that address has an account with us, a link to set a new password is on its way.
          It expires in an hour.
        </p>
        <p className="mt-5 text-[0.85rem] leading-relaxed text-charcoal/65">
          Nothing arrived? Check the spam folder, then try again — the link is only sent to
          addresses we hold.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        disabled={busy}
        placeholder="you@example.com"
        error={fields.email}
      />

      <Honeypot />
      <FormNotice error={error} />

      <PrimaryButton type="submit" busy={busy} busyLabel="Sending…">
        Send a reset link
      </PrimaryButton>
    </form>
  );
}
