"use client";

import { useEffect } from "react";
import { CONTACT, telHref, phoneIsPlaceholder } from "@/lib/brand";

type Props = {
  className?: string;
  /** Defaults to the formatted number; pass a label like "Contact" instead. */
  children?: React.ReactNode;
  /** Adds a short screen-reader hint naming the number being dialled. */
  describe?: boolean;
};

/**
 * Opens the device dialer with the business number filled in.
 *
 * A plain <a href="tel:…"> is the whole mechanism — it is what phones,
 * Android, iOS and desktop handoff apps all understand, and it needs no
 * JavaScript to work. The component exists so the number lives in exactly one
 * place and every dial link is normalised the same way.
 */
/** Module-scoped so the notice appears once, not once per link per render. */
let warned = false;

export default function ContactLink({ className = "", children, describe = false }: Props) {
  useEffect(() => {
    if (!warned && process.env.NODE_ENV !== "production" && phoneIsPlaceholder()) {
      warned = true;
      console.warn(
        "[contact] CONTACT.phone in src/lib/brand.ts is still the placeholder — dial links will not reach anyone."
      );
    }
  }, []);

  return (
    <a href={telHref()} className={className} data-contact="phone">
      {children ?? CONTACT.phone}
      {describe && <span className="sr-only"> — call {CONTACT.phone}</span>}
    </a>
  );
}
