"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { del, post } from "@/lib/client/api";
import { FormNotice } from "./FormBits";
import { PrimaryButton } from "./Buttons";

export type SavedItem = {
  slug: string;
  name: string;
  note: string;
  /** How the piece is made, where the catalogue says. */
  material: string | null;
  categorySlug: string;
  categoryTitle: string;
  image: { url: string; width: number; height: number } | null;
  savedAt: string;
};

/**
 * The saved pieces, laid out as a catalogue spread rather than a wishlist.
 *
 * Two columns, each photograph at its own proportions. Nothing is cropped to a
 * grid cell: these are pieces of furniture photographed deliberately, and a
 * chair trimmed to a square is a different chair. The columns are therefore
 * ragged along the bottom, which is what a printed catalogue looks like.
 *
 * Because every image carries its real width and height, the space is reserved
 * before the file arrives and nothing jumps as the page loads. Only the first
 * two load eagerly; the rest wait until they are near.
 */
export default function SavedGrid({ items: initial }: { items: SavedItem[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [enquiring, setEnquiring] = useState<string | null>(null);

  async function remove(slug: string) {
    const previous = items;
    setItems((list) => list.filter((item) => item.slug !== slug));
    setError(null);

    const result = await del(`/api/account/favourites?slug=${encodeURIComponent(slug)}`);
    if (!result.ok) {
      setItems(previous); // Put it back: the server disagreed.
      setError(result.error);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-8 text-[0.88rem] text-rust">
          {error}
        </p>
      )}

      <ul className="grid gap-x-10 gap-y-16 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.slug} className="group flex flex-col">
            <Link
              href={`/collections/${item.categorySlug}/${item.slug}`}
              className="block"
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="media-frame bg-transparent">
                {item.image && (
                  <Image
                    src={item.image.url}
                    alt={item.name}
                    width={item.image.width}
                    height={item.image.height}
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 44vw, 360px"
                    priority={index < 2}
                    loading={index < 2 ? "eager" : "lazy"}
                    className="h-auto w-full transition-opacity duration-[1.2s] group-hover:opacity-90"
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  />
                )}
              </div>
            </Link>

            <div className="mt-5 flex items-baseline justify-between gap-6 border-b border-charcoal/10 pb-4">
              <div className="min-w-0">
                <Link
                  href={`/collections/${item.categorySlug}/${item.slug}`}
                  className="block font-display text-[1.15rem] leading-snug text-charcoal transition-opacity duration-500 hover:opacity-60"
                >
                  {item.name}
                </Link>
                <p className="eyebrow mt-2 text-[0.68rem] text-charcoal/65">{item.categoryTitle}</p>
              </div>
              {/* No price is claimed anywhere on this site, and the account is
                  not the place to start inventing one. */}
              <p className="shrink-0 text-[0.82rem] text-charcoal/65">Price on enquiry</p>
            </div>

            {item.note && (
              <p className="mt-4 text-[0.92rem] leading-relaxed text-charcoal/75">{item.note}</p>
            )}

            {item.material && (
              <p className="mt-3 max-w-md text-[0.88rem] leading-relaxed text-charcoal/65">
                <span className="eyebrow mr-2 text-[0.68rem] text-charcoal/70">Material</span>
                {item.material}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link
                href={`/collections/${item.categorySlug}/${item.slug}`}
                className="text-[0.88rem] text-charcoal underline decoration-charcoal/25 underline-offset-4 transition-colors hover:decoration-charcoal"
              >
                View the piece
              </Link>

              <button
                type="button"
                onClick={() => setEnquiring(enquiring === item.slug ? null : item.slug)}
                aria-expanded={enquiring === item.slug}
                className="text-[0.88rem] text-charcoal/75 underline-offset-4 transition-colors hover:text-charcoal hover:underline"
              >
                {enquiring === item.slug ? "Not now" : "Ask about it"}
              </button>

              <button
                type="button"
                onClick={() => remove(item.slug)}
                aria-label={`Remove ${item.name} from your saved pieces`}
                className="ml-auto text-[0.82rem] text-charcoal/70 underline-offset-4 transition-colors duration-500 hover:text-rust hover:underline"
              >
                Remove
              </button>
            </div>

            {enquiring === item.slug && (
              <EnquiryNote
                slug={item.slug}
                name={item.name}
                onDone={() => setEnquiring(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Starting an enquiry without leaving the page.
 *
 * The piece is already known and so is the sender — the session supplies the
 * name, the address and the number — so all that is left to ask for is the
 * sentence they want to send. Anything more would be a form for the sake of
 * looking like one.
 */
function EnquiryNote({
  slug,
  name,
  onDone,
}: {
  slug: string;
  name: string;
  onDone: () => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const result = await post<{ enquiry: { reference: string } }>("/api/account/enquiries", {
      productSlug: slug,
      subject: name,
      message,
    });

    setBusy(false);

    if (!result.ok) {
      setError(result.fields?.message ?? result.error);
      return;
    }

    setReference(result.enquiry.reference);
  }

  if (reference) {
    return (
      <div aria-live="polite" className="mt-6 border-l border-olive/50 pl-5">
        <p className="text-[0.95rem] leading-relaxed text-charcoal/85">
          Sent. We reply within two working days.
        </p>
        <p className="mt-2 text-[0.85rem] text-charcoal/65">
          Reference <span className="tracking-[0.12em] text-charcoal/85">{reference}</span> —{" "}
          <Link
            href={`/account/enquiries/${reference}`}
            className="underline decoration-charcoal/25 underline-offset-4 hover:decoration-charcoal"
          >
            follow it here
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-4 text-[0.85rem] text-charcoal/70 underline-offset-4 hover:text-charcoal hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="mt-6 border-l border-charcoal/15 pl-5">
      <label htmlFor={`note-${slug}`} className="eyebrow block text-[0.7rem] text-charcoal/65">
        What would you like to know?
      </label>
      <textarea
        id={`note-${slug}`}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        rows={3}
        maxLength={2000}
        required
        disabled={busy}
        placeholder="Dimensions, materials, lead time, or a room it has to fit."
        className="mt-3 w-full resize-y border-b border-charcoal/20 bg-transparent pb-2 text-[0.96rem] leading-relaxed text-charcoal placeholder:text-charcoal/60 focus:border-charcoal focus:outline-none disabled:opacity-50"
      />

      <div className="mt-4">
        <FormNotice error={error} />
      </div>

      <div className="mt-3 w-44">
        <PrimaryButton type="submit" busy={busy} busyLabel="Sending…">
          Send enquiry
        </PrimaryButton>
      </div>
    </form>
  );
}
