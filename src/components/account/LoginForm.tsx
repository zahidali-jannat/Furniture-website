"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Divider, GoogleButton, PrimaryButton } from "./Buttons";
import { Field, PasswordField } from "./Field";
import { FormNotice, Honeypot } from "./FormBits";
import { post } from "@/lib/client/api";

/**
 * Signing in.
 *
 * The server refuses to say which half of the pair was wrong, so the form does
 * not pretend to know either: one sentence under the fields, and a standing
 * note that an account made with Google has no password here — which is a real
 * dead end people hit, and the only way to explain it without confirming that
 * any particular address is registered.
 */
export default function LoginForm({
  google,
  next,
  reason,
}: {
  google: boolean;
  next: string;
  reason?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(reasonMessage(reason));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showGoogleHint, setShowGoogleHint] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await post<{ next: string }>("/api/auth/login", {
      email: form.get("email"),
      password: form.get("password"),
      company: form.get("company"),
      next,
    });

    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      setFields(result.fields ?? {});
      setShowGoogleHint(result.code === "credentials" && google);

      // An account that never finished registering: send them back to the
      // step they left, with a fresh code already on its way.
      if (result.code === "verify_email") {
        router.push("/create-account/verify");
      }
      return;
    }

    // The cookies were set by the response that just came back, so the router
    // cache is holding pages rendered for a signed-out visitor. Refreshing
    // before navigating is what stops the account page arriving from that
    // cache and bouncing straight back here.
    router.refresh();
    router.push(result.next || next);
  }

  return (
    <>
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

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            required
            disabled={busy}
            placeholder="••••••••••"
            error={fields.password}
          />
          <div className="-mt-1 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-[0.72rem] text-charcoal/45 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
            >
              Forgotten your password?
            </Link>
          </div>
        </div>

        <Honeypot />

        <FormNotice error={error}>
          {showGoogleHint && (
            <p className="mt-1.5 text-[0.72rem] leading-snug text-charcoal/45">
              If you set this account up with Google, use the button below instead — there is
              no password on it yet.
            </p>
          )}
        </FormNotice>

        <PrimaryButton type="submit" busy={busy} busyLabel="Signing in…">
          Log in
        </PrimaryButton>
      </form>

      {google && (
        <div className="mt-8 space-y-8">
          <Divider />
          <GoogleButton href={`/api/auth/google?next=${encodeURIComponent(next)}`} />
        </div>
      )}
    </>
  );
}

/** Reasons this page can be arrived at, rather than navigated to. */
function reasonMessage(reason?: string): string | null {
  switch (reason) {
    case "expired":
      return "Your session has ended. Please sign in again.";
    case "google_cancelled":
      return "That sign-in was cancelled.";
    case "google_unverified":
      return "Google has not confirmed that address yet, so we cannot use it to sign you in.";
    case "google_unavailable":
      return "Google sign-in is not set up on this server.";
    case "google_state":
    case "google_expired":
      return "That sign-in took too long. Please try again.";
    case "google_failed":
      return "We could not complete that sign-in. Please try again.";
    case "suspended":
      return "This account is closed. Write to us and we will look into it.";
    default:
      return null;
  }
}
