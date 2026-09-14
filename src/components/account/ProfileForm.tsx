"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuietButton } from "./Buttons";
import { Field } from "./Field";
import { FormNotice } from "./FormBits";
import { patch } from "@/lib/client/api";

/**
 * Name and number.
 *
 * The address is shown but not editable: changing it is a change of identity
 * and needs the new address proved before the old one stops working, which is
 * a flow of its own rather than a field in a settings form. Saying so is
 * better than a disabled input with no explanation.
 *
 * Saving a new number sends a code straight away — the row above turns amber
 * and asks for it — because a number nobody has proved is not a number we can
 * use.
 */
export default function ProfileForm({
  fullName,
  email,
  phone,
}: {
  fullName: string;
  email: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    const nextName = String(form.get("fullName") ?? "").trim();
    const nextPhone = String(form.get("phone") ?? "").trim();

    setBusy(true);
    setError(null);
    setSaved(null);
    setFields({});

    const result = await patch<{ verifyPhone: boolean; codeSent: boolean }>(
      "/api/account/profile",
      {
        ...(nextName && nextName !== fullName ? { fullName: nextName } : {}),
        ...(nextPhone && nextPhone !== phone ? { phone: nextPhone } : {}),
      }
    );

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    setSaved(
      result.verifyPhone
        ? result.codeSent
          ? "Saved. A code is on its way to your new number."
          : "Saved. Your number needs confirming, but no message could be sent — see the note on the overview."
        : "Saved."
    );

    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-6">
      <Field
        label="Full name"
        name="fullName"
        defaultValue={fullName}
        autoComplete="name"
        disabled={busy}
        error={fields.fullName}
      />

      <Field
        label="Email address"
        name="email"
        type="email"
        defaultValue={email}
        disabled
        readOnly
        hint="To change the address on an account, write to the workshop."
      />

      <Field
        label="Phone number"
        name="phone"
        type="tel"
        defaultValue={phone ?? ""}
        autoComplete="tel"
        disabled={busy}
        placeholder="+45 31 22 44 66"
        error={fields.phone}
        hint="With the country code. A new number needs confirming."
      />

      <FormNotice error={error} success={saved} />

      <QuietButton type="submit" busy={busy}>
        Save changes
      </QuietButton>
    </form>
  );
}
