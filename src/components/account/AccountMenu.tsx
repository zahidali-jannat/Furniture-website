"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { get, post } from "@/lib/client/api";

type Me = {
  fullName: string;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

const SIGNED_IN = [
  { href: "/account", label: "Overview" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/saved", label: "Saved pieces" },
  { href: "/account/enquiries", label: "Enquiries" },
  { href: "/account/consultations", label: "Consultations" },
  { href: "/account/preferences", label: "Settings" },
];

/**
 * The account menu in the site header.
 *
 * Deliberately does nothing until it is opened. Every page on this site is
 * cached or statically built, so a header that asked the server who you were
 * on every page load would put a private request in front of the whole
 * catalogue — and a bar that rendered "Sign in" and then flickered to your
 * name a moment later would look broken.
 *
 * So: one label, always. On opening, a readable cookie says whether a session
 * exists at all — it holds "1" and nothing else — and only then is the name
 * fetched, once, and kept for the rest of the visit.
 */
export default function AccountMenu({ tone }: { tone: "light" | "dark" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  /**
   * Opening it is what asks the question.
   *
   * The readable cookie holds "1" and nothing else; only if it is there is the
   * name fetched, once. Doing this in the handler rather than an effect keeps
   * it out of the render path entirely — closed, this component costs nothing.
   */
  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next || checked) return;

    const member = document.cookie.split("; ").some((c) => c === "mn_member=1");
    if (!member) {
      setChecked(true);
      return;
    }

    const result = await get<{ user: Me }>("/api/auth/me");
    if (result.ok) setMe(result.user);
    setChecked(true);
  }

  // Outside click and Escape, plus returning focus where it came from.
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        root.current?.querySelector("button")?.focus();
      }
    };

    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    // The first thing in the panel takes focus, so a keyboard reaches the
    // links without tabbing through the rest of the bar.
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    return () => {
      window.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    await post("/api/auth/logout", {});
    // The router cache is holding pages rendered for somebody who was signed
    // in; clear it before navigating so none of them is shown to whoever is at
    // the keyboard now.
    router.refresh();
    router.push("/");
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        data-magnetic
        className="relative block rounded-full px-4 py-2 outline-none focus-visible:ring-1 focus-visible:ring-current"
      >
        <span
          data-pill
          aria-hidden="true"
          className="absolute inset-0 origin-center rounded-full bg-current opacity-0"
          style={{ transform: "scale(0.88)" }}
        />
        <span data-label className="relative block whitespace-nowrap eyebrow tracking-[0.2em]">
          Account
        </span>
      </button>

      {open && (
        <div
          ref={panel}
          role="menu"
          aria-label="Account"
          className={[
            "absolute right-0 top-full z-50 mt-3 w-64 border bg-bone p-5 text-charcoal",
            // The panel is its own ground: bone on bone in the light sections,
            // and bone against the dark ones, rather than inheriting the bar's
            // inverted colours and becoming unreadable.
            tone === "dark" ? "border-bone/25" : "border-charcoal/12",
          ].join(" ")}
        >
          {me ? (
            <>
              <div className="pb-4">
                <p className="truncate font-display text-[1.05rem] leading-tight">{me.fullName}</p>
                <p className="mt-1 truncate text-[0.82rem] text-charcoal/70">{me.email}</p>
                <p className="mt-2.5 flex items-center gap-2 text-[0.76rem] text-charcoal/70">
                  <span
                    aria-hidden="true"
                    className={`h-1 w-1 rounded-full ${me.phoneVerified ? "bg-olive" : "bg-clay"}`}
                  />
                  {me.phoneVerified ? "Email and phone confirmed" : "Email confirmed"}
                </p>
              </div>

              <ul className="border-t border-charcoal/10 pt-2">
                {SIGNED_IN.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="block py-1.5 text-[0.92rem] text-charcoal/80 transition-colors duration-300 hover:text-charcoal focus-visible:text-charcoal focus-visible:outline-none"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-2 border-t border-charcoal/10 pt-3">
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  disabled={signingOut}
                  className="text-[0.92rem] text-charcoal/70 transition-colors duration-300 hover:text-charcoal disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            </>
          ) : checked ? (
            <>
              <p className="font-display text-[1.05rem] leading-snug">Your account</p>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-charcoal/70">
                Save the pieces you are considering and keep your enquiries in one place.
              </p>

              <div className="mt-5 space-y-2.5">
                <Link
                  href={`/login?next=${encodeURIComponent(pathname)}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block border border-charcoal bg-charcoal px-5 py-3 text-center eyebrow text-[0.72rem] text-bone transition-colors duration-500 hover:bg-transparent hover:text-charcoal"
                >
                  Sign in
                </Link>
                <Link
                  href="/create-account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="block border border-charcoal/20 px-5 py-3 text-center eyebrow text-[0.72rem] text-charcoal transition-colors duration-500 hover:border-charcoal"
                >
                  Create an account
                </Link>
              </div>
            </>
          ) : (
            <p className="py-2 text-[0.88rem] text-charcoal/65">One moment…</p>
          )}
        </div>
      )}
    </div>
  );
}
