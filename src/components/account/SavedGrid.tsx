"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { del } from "@/lib/client/api";

export type SavedItem = {
  slug: string;
  name: string;
  note: string;
  categorySlug: string;
  categoryTitle: string;
  image: { url: string; width: number; height: number } | null;
  savedAt: string;
};

/**
 * The saved pieces.
 *
 * Removal is optimistic — the row goes as the button is pressed, and comes
 * back if the server disagrees. The alternative is a spinner on a card for
 * half a second to confirm something the visitor already decided.
 *
 * Images below the first row are lazy: a long list of saved furniture would
 * otherwise pull a dozen photographs down before any of them is on screen.
 * Width and height are always passed, so the grid never jumps as they load.
 */
export default function SavedGrid({ items: initial }: { items: SavedItem[] }) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function remove(slug: string) {
    const previous = items;
    setItems((list) => list.filter((item) => item.slug !== slug));
    setError(null);

    const result = await del(`/api/account/favourites?slug=${encodeURIComponent(slug)}`);
    if (!result.ok) {
      setItems(previous);
      setError(result.error);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-6 text-[0.78rem] text-clay">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.slug} className="group">
            <Link href={`/collections/${item.categorySlug}/${item.slug}`} className="block">
              <div className="media-frame aspect-[4/5]">
                {item.image && (
                  <Image
                    src={item.image.url}
                    alt={item.name}
                    width={item.image.width}
                    height={item.image.height}
                    sizes="(max-width: 768px) 45vw, 30vw"
                    loading={index < 3 ? "eager" : "lazy"}
                    className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.03]"
                    style={{ transitionTimingFunction: "var(--ease-lux)" }}
                  />
                )}
              </div>
            </Link>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Link
                  href={`/collections/${item.categorySlug}/${item.slug}`}
                  className="block truncate text-[0.92rem] text-charcoal transition-opacity hover:opacity-60"
                >
                  {item.name}
                </Link>
                <p className="eyebrow mt-1.5 text-[0.55rem] text-charcoal/35">
                  {item.categoryTitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(item.slug)}
                aria-label={`Remove ${item.name} from your saved pieces`}
                className="shrink-0 text-[0.72rem] text-charcoal/30 underline-offset-4 transition-colors duration-500 hover:text-clay hover:underline"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
