"use client";

import { useState } from "react";
import Link from "next/link";
import { PrimaryButton } from "./Buttons";
import { PasswordField } from "./Field";
import { FormNotice } from "./FormBits";
import PasswordMeter from "./PasswordMeter";
import { post } from "@/lib/client/api";

/**
 * Setting a new password from a link.
 *
 * The visitor is not signed in afterwards, and the copy says why: every
 * session on the account was just revoked, including anyone else's. Signing
 * them straight in would undo half the point and hide the other half.
 */
export default function ResetForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    setFields({});

    const result = await post("/api/auth/password/reset", {
      token,
      password,
      confirmPassword: confirm,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div aria-live="polite" className="border-t border-charcoal/12 pt-7">
        <p className="display text-[1.6rem] leading-tight text-charcoal">That is done.</p>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-charcoal/55">
          Your new password is set, and every device that was signed in has been signed out.
        </p>
        <Link
          href="/login"
          className="eyebrow mt-7 inline-block border border-charcoal px-8 py-4 text-[0.68rem] text-charcoal transition-colors duration-700 hover:bg-charcoal hover:text-bone"
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        disabled={busy}
        placeholder="••••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fields.password}
      />

      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        disabled={busy}
        placeholder="••••••••••"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={fields.confirmPassword}
      />

      <PasswordMeter password={password} confirm={confirm} />

      <FormNotice error={error} />

      <PrimaryButton type="submit" busy={busy} busyLabel="Saving…">
        Set the new password
      </PrimaryButton>
    </form>
  );
}
