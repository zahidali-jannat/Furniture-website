"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { del, get, post } from "@/lib/client/api";

/**
 * Saving a piece from its own page.
 *
 * These pages are generated at build time and served from the edge, so this
 * has to decide what to render without the server knowing who is asking. It
 * reads one readable cookie — which says a session exists and nothing more —
 * and only then asks the server which pieces are saved. A signed-out visitor
 * costs no requests at all; a signed-in one costs a single list, cached for
 * the rest of the visit, however many pieces they look at.
 *
 * Pressing it while signed out is not an error: it remembers where you were
 * and brings you back here afterwards.
 */

// One fetch per page load at most, shared by every button on the page.
let cache: Promise<Set<string>> | null = null;

function signedIn() {
  return document.cookie.split("; ").some((c) => c === "mn_member=1");
}

function savedSlugs(): Promise<Set<string>> {
  cache ??= get<{ items: { slug: string }[] }>("/api/account/favourites").then((result) =>
    result.ok ? new Set(result.items.map((item) => item.slug)) : new Set<string>()
  );
  return cache;
}

export default function SaveButton({ slug, name }: { slug: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;

    // The signed-out case resolves immediately rather than setting state on
    // the spot: a synchronous setState in an effect body costs a second render
    // pass on every product page, signed in or not.
    const lookup = signedIn() ? savedSlugs() : Promise.resolve(new Set<string>());

    lookup.then((slugs) => {
      if (alive) setSaved(slugs.has(slug));
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  async function toggle() {
    if (busy) return;

    if (!signedIn()) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const next = !saved;
    setBusy(true);
    setSaved(next); // Optimistic: the press should feel like the thing itself.

    const result = next
      ? await post("/api/account/favourites", { productSlug: slug })
      : await del(`/api/account/favourites?slug=${encodeURIComponent(slug)}`);

    setBusy(false);

    if (!result.ok) {
      setSaved(!next);
      // A session that expired while the page sat open.
      if (result.status === 401) {
        cache = null;
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // Keep the shared list honest for the other buttons on this page.
    const slugs = await savedSlugs();
    if (next) slugs.add(slug);
    else slugs.delete(slug);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved ?? false}
      aria-label={saved ? `Remove ${name} from your saved pieces` : `Save ${name} to your account`}
      className="group inline-flex items-center gap-3 text-left eyebrow text-charcoal/75 transition-colors duration-500 hover:text-charcoal"
      style={{ transitionTimingFunction: "var(--ease-lux)" }}
    >
      <span
        aria-hidden="true"
        className={[
          "block h-1.5 w-1.5 rounded-full border border-charcoal/40 transition-colors duration-500",
          saved ? "bg-charcoal" : "bg-transparent group-hover:bg-charcoal/20",
        ].join(" ")}
      />
      {saved ? "Saved to your account" : "Save this piece"}
    </button>
  );
}
