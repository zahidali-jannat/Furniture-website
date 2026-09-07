import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/catalogue";

/**
 * Everything here is CSS on `group-hover` — no JS per card. On a page holding
 * a few dozen products that difference matters, and the transitions are long
 * enough that a spring would be wasted on them anyway.
 */
export default function ProductCard({
  product,
  categorySlug,
  aspect,
  sizes,
  index,
}: {
  product: Product;
  categorySlug: string;
  aspect: string;
  sizes: string;
  index: number;
}) {
  return (
    <article id={product.id} className="group relative">
      <Link href={`/collections/${categorySlug}/${product.id}`} className="block">
      {/* The highlight sits behind and slightly outside the frame, so it reads
          as the piece lifting off the page rather than a box switching on. */}
      <div className="pointer-events-none absolute -inset-x-4 -inset-y-5 -z-10 rounded-sm bg-oat/0 transition-colors duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-oat/45" />

      {/* The image is the box, so nothing is cropped and nothing is
          letterboxed. `aspect` is now only a height ceiling — the width follows
          from the piece's real proportions. Hover lifts rather than magnifies:
          scaling past 1 would push the edges out of view.

          items-center matters: without it the flex parent stretches the image
          to the container height and the proportions are lost. */}
      <div className={`flex w-full items-center justify-center ${aspect}`}>
        <Image
          src={product.src}
          alt={product.name}
          width={product.width}
          height={product.height}
          sizes={sizes}
          loading={index < 4 ? "eager" : "lazy"}
          className="block h-auto max-h-full w-auto max-w-full transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:brightness-[1.04]"
        />
      </div>

      <div className="mt-5 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(1.15rem,1.5vw,1.4rem)] leading-snug text-charcoal">
            {product.name}
          </h3>

          {/* Visible by default, and only held back for hover where hover
              actually exists — on touch there is no hover, so gating it on
              `group-hover` alone would hide the description permanently.
              Both rules sit inside the same media query so the more specific
              group-hover one reliably wins. */}
          <p className="mt-1.5 text-[0.82rem] leading-relaxed text-charcoal/55 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100">
            {product.note}
          </p>
        </div>

        <span
          aria-hidden="true"
          className="mt-1 shrink-0 eyebrow text-charcoal/25 transition-colors duration-700 group-hover:text-charcoal/60"
        >
          {product.id.split("-").pop()}
        </span>
      </div>

      <span className="mt-4 block h-px w-full origin-left scale-x-0 bg-charcoal/25 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100" />
      </Link>
    </article>
  );
}
