"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Divider, GoogleButton, PrimaryButton } from "./Buttons";
import { Field, PasswordField } from "./Field";
import { FormNotice, Honeypot } from "./FormBits";
import PasswordMeter from "./PasswordMeter";
import { post } from "@/lib/client/api";

/**
 * Opening an account.
 *
 * Everything is asked for once, on one screen — name, address, number,
 * password — and the proving happens afterwards. Splitting this into a wizard
 * makes it feel longer than it is, and people abandon wizards.
 *
 * The password rules are shown as they are met rather than asserted up front,
 * and the two password fields are checked against each other here so nobody
 * finds out they mistyped after a round trip.
 */
export default function RegisterForm({ google, sms }: { google: boolean; sms: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await post<{ next: string }>("/api/auth/register", {
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
      company: form.get("company"),
    });

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    router.push("/create-account/verify");
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <Field
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          disabled={busy}
          placeholder="Anna Sørensen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fields.fullName}
        />

        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={busy}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fields.email}
        />

        <Field
          label="Phone number"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          disabled={busy}
          placeholder="+45 31 22 44 66"
          error={fields.phone}
          hint={
            sms
              ? "With the country code, so the code reaches you."
              : "With the country code. We will confirm it when we can text you."
          }
        />

        <PasswordField
          label="Password"
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
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          disabled={busy}
          placeholder="••••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fields.confirmPassword}
        />

        <PasswordMeter
          password={password}
          confirm={confirm}
          context={[name, email.split("@")[0] ?? ""].filter(Boolean)}
        />

        <Honeypot />

        <FormNotice error={error} />

        <PrimaryButton type="submit" busy={busy} busyLabel="Creating your account…">
          Create an account
        </PrimaryButton>

        <p className="text-[0.82rem] leading-relaxed text-charcoal/65">
          {sms
            ? "We send one code to your address and one to your phone. Both are needed before the account opens — it is how we keep a stranger from using your details."
            : "We send a code to your address to confirm it is yours. Text messages are not set up on this server yet, so your number is kept on file and confirmed later."}
        </p>
      </form>

      {google && (
        <div className="mt-8 space-y-8">
          <Divider />
          <GoogleButton href="/api/auth/google" label="Sign up with Google" />
        </div>
      )}
    </>
  );
}
