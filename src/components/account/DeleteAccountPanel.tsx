"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, PasswordField } from "./Field";
import { FormNotice } from "./FormBits";
import { post } from "@/lib/client/api";

/**
 * Closing the account.
 *
 * Two deliberate acts: opening this, and typing DELETE into it. No modal — a
 * dialog that appears over the page is easy to dismiss by reflex and easy to
 * confirm by reflex too, which is the wrong pair of properties for something
 * irreversible.
 *
 * The copy says exactly what goes and what stays. Enquiries stay, unattached,
 * because the workshop may be halfway through answering one.
 */
export default function DeleteAccountPanel({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await post<{ next: string }>("/api/account/delete", {
      confirm: form.get("confirm"),
      password: form.get("password") ?? undefined,
    });

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      setFields(result.fields ?? {});
      return;
    }

    // Nothing of this account may be served from the router cache now.
    router.refresh();
    router.push("/");
  }

  if (!open) {
    return (
      <div className="max-w-xl">
        <p className="text-[0.95rem] leading-relaxed text-charcoal/75">
          Closing your account removes your details, your saved pieces and every device
          you are signed in on. Enquiries already with the workshop stay, so anything we
          are in the middle of can be finished — they are no longer attached to you.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 text-[0.88rem] text-rust underline decoration-clay/30 underline-offset-4 transition-colors hover:decoration-clay"
        >
          Close my account
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-6 border-l border-rust/40 pl-6">
      <p className="text-[0.95rem] leading-relaxed text-charcoal/75">
        This cannot be undone. Type <span className="text-charcoal">DELETE</span> to confirm.
      </p>

      <Field
        label="Confirm"
        name="confirm"
        required
        disabled={busy}
        placeholder="DELETE"
        autoComplete="off"
        spellCheck={false}
        error={fields.confirm}
      />

      {hasPassword && (
        <PasswordField
          label="Your password"
          name="password"
          autoComplete="current-password"
          required
          disabled={busy}
          placeholder="••••••••••"
          error={fields.password}
        />
      )}

      <FormNotice error={error} />

      <div className="flex flex-wrap items-center gap-6">
        <button
          type="submit"
          disabled={busy}
          className="border border-rust px-7 py-3.5 eyebrow text-[0.74rem] text-rust transition-colors duration-700 hover:bg-rust hover:text-bone disabled:opacity-50"
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        >
          {busy ? "Closing…" : "Close my account"}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="text-[0.88rem] text-charcoal/70 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
        >
          Keep my account
        </button>
      </div>
    </form>
  );
}
