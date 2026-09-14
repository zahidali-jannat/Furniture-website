"use client";

import { useState } from "react";
import { QuietButton } from "./Buttons";
import { PasswordField } from "./Field";
import { FormNotice } from "./FormBits";
import PasswordMeter from "./PasswordMeter";
import { post } from "@/lib/client/api";

/**
 * Changing the password.
 *
 * An account made with Google has never had one, so the current-password field
 * is not shown to it — there is nothing to type, and asking for something that
 * does not exist is how people conclude the form is broken. Setting one there
 * adds a second way in rather than replacing Google.
 */
export default function ChangePasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setDone(null);
    setFields({});

    const result = await post("/api/auth/password/change", {
      currentPassword: form.get("currentPassword") ?? "",
      password,
      confirmPassword: confirm,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    setPassword("");
    setConfirm("");
    (event.target as HTMLFormElement).reset();
    setDone(
      hasPassword
        ? "Password changed. Every other device has been signed out."
        : "Password set. You can now sign in with your address as well as with Google."
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-6">
      {hasPassword && (
        <PasswordField
          label="Current password"
          name="currentPassword"
          autoComplete="current-password"
          required
          disabled={busy}
          placeholder="••••••••••"
          error={fields.currentPassword}
        />
      )}

      <PasswordField
        label={hasPassword ? "New password" : "Choose a password"}
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

      <FormNotice error={error} success={done} />

      <QuietButton type="submit" busy={busy}>
        {hasPassword ? "Change password" : "Set a password"}
      </QuietButton>
    </form>
  );
}
