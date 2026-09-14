"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

/**
 * The last few pieces this browser looked at.
 *
 * Kept in localStorage rather than on the server, deliberately. Browsing
 * history is the most personal thing a furniture site could collect and the
 * least necessary: the only purpose it serves here is helping somebody find
 * their way back to a chair they liked, and a device can remember that by
 * itself. Nothing is sent anywhere, there is no table holding it, and clearing
 * the browser clears it.
 *
 * It is also why this is a client component: the server genuinely does not
 * know, and will not be told.
 */

const KEY = "mn.recently-viewed";
const LIMIT = 6;

export type ViewedPiece = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  src: string;
  width: number;
  height: number;
};

export function readViewed(): ViewedPiece[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ViewedPiece => typeof (item as ViewedPiece)?.slug === "string");
  } catch {
    // Private windows, blocked storage, a half-written value. Not worth a fuss.
    return [];
  }
}

/** Mounted on a product page; records the visit and renders nothing. */
export function RecordView(piece: ViewedPiece) {
  // Keyed on the slug, not on the props object: the object is new on every
  // render and would re-write storage each time for no reason.
  const { slug, name, category, categorySlug, src, width, height } = piece;

  useEffect(() => {
    try {
      const entry = { slug, name, category, categorySlug, src, width, height };
      const next = [entry, ...readViewed().filter((item) => item.slug !== slug)].slice(0, LIMIT);
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage refused — a private window, or blocked site data. The site
      // works the same without it.
    }
  }, [slug, name, category, categorySlug, src, width, height]);

  return null;
}

export default function RecentlyViewed() {
  // Starts empty so the server and the first client render agree; whatever the
  // browser remembers arrives a tick later, in its own row, shifting nothing.
  const [pieces, setPieces] = useState<ViewedPiece[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPieces(readViewed()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <section className="border-t border-charcoal/12 pt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow text-[0.74rem] text-charcoal/70">Recently viewed</h2>
        <p className="text-[0.8rem] text-charcoal/70">On this device only</p>
      </div>

      <ul className="mt-8 flex gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pieces.map((piece) => (
          <li key={piece.slug} className="w-32 shrink-0 sm:w-36">
            <Link href={`/collections/${piece.categorySlug}/${piece.slug}`} className="group block">
              <div className="media-frame bg-transparent">
                <Image
                  src={piece.src}
                  alt={piece.name}
                  width={piece.width}
                  height={piece.height}
                  sizes="144px"
                  loading="lazy"
                  className="h-auto w-full transition-opacity duration-700 group-hover:opacity-80"
                  style={{ transitionTimingFunction: "var(--ease-lux)" }}
                />
              </div>
              <p className="mt-2.5 truncate text-[0.88rem] text-charcoal/85">{piece.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
