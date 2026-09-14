"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/client/api";

/**
 * Signing out.
 *
 * A POST, so that a prefetcher or an image tag on some other site cannot end
 * the session by accident or on purpose. Afterwards the router cache is
 * cleared before navigating: it is holding pages rendered for somebody who was
 * signed in, and those must not be shown to whoever is at the keyboard now.
 */
export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    await post("/api/auth/logout", {});
    router.refresh();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={
        className ??
        "eyebrow text-[0.74rem] text-charcoal/65 transition-colors duration-500 hover:text-charcoal disabled:opacity-50"
      }
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
