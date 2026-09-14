import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import type { Category, Product } from "@/lib/catalogue";

/**
 * Everything the site tells a crawler, in one place.
 *
 * Two rules run through it. First, nothing is invented: every description is
 * composed from the catalogue and from copy that already appears on the page,
 * so a search result cannot promise something the page does not say. Second,
 * the search words are put where they read naturally — a title tag and a
 * sentence of description — rather than sprinkled through the prose, which
 * would cost the brand more than it gained.
 */

/**
 * The origin canonical URLs and the sitemap are built from.
 *
 * SITE_URL is the public address; APP_ORIGIN is reused when it is not set,
 * since the auth flows already need one. Localhost is the last resort and is
 * correct for development — a canonical pointing at a placeholder domain would
 * be worse than one pointing at the machine it was rendered on.
 */
export function siteUrl(): string {
  const raw = process.env.SITE_URL || process.env.APP_ORIGIN || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export function absolute(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The image a shared link shows when the page has no better one of its own. */
export const SHARE_IMAGE = "/poster/shot-01-living-wide.jpg";

/**
 * How each furniture type is described where somebody is searching rather than
 * browsing.
 *
 * The brand's own word for a thing is what appears on the page — "Sofas",
 * "Chandeliers". This is the same thing said the way it is typed into a search
 * box, and it is used in the title tag and nowhere else. Anything not listed
 * falls back to the catalogue's own title, because a wrong description is worse
 * than a plain one.
 */
const SEARCH_LABEL: Record<string, string> = {
  sofa: "Designer sofas",
  chair: "Lounge chairs",
  almira: "Wardrobes",
  wardrobe: "Wardrobes",
  bed: "Beds",
  chandeliers: "Chandeliers",
  lighting: "Lighting",
  table: "Dining tables",
  "side-table": "Side tables",
  cabinet: "Cabinets",
  dining: "Dining furniture",
  interior: "Interiors",
};

export function searchLabel(category: Pick<Category, "slug" | "title">): string {
  return SEARCH_LABEL[category.slug] ?? category.title;
}

/** Trims to a length a search result will actually show, on a word boundary. */
export function clamp(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

type PageInput = {
  title: string;
  description: string;
  path: string;
  /** Absolute or root-relative. Falls back to the house image. */
  image?: string;
  imageAlt?: string;
  /** Sign-in, account and anything else that should not be indexed. */
  noIndex?: boolean;
};

/**
 * The metadata every public page shares, filled in with what makes this one
 * different: its own title, its own sentence, its own canonical URL and its own
 * photograph.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = SHARE_IMAGE,
  imageAlt,
  noIndex = false,
}: PageInput): Metadata {
  const url = absolute(path);
  const shared = clamp(description);

  return {
    title,
    description: shared,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: BRAND.wordmark,
      locale: "en_GB",
      title: `${title} — ${BRAND.wordmark}`,
      description: shared,
      url,
      images: [{ url: absolute(image), alt: imageAlt ?? title, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${BRAND.wordmark}`,
      description: shared,
      images: [absolute(image)],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

// ------------------------------------------------------------- descriptions --

/**
 * A category's sentence, composed from what the catalogue already holds.
 *
 * The intro and the materials are the studio's own words; the count and the
 * lead time are facts the site states elsewhere. Nothing here is generated
 * prose about "premium quality".
 */
export function categoryDescription(category: Category): string {
  const pieces = [
    category.intro || category.tagline,
    category.story?.materials,
    category.count > 0
      ? `${category.count} ${category.count === 1 ? "piece" : "pieces"}, made in runs of forty and quoted on enquiry.`
      : null,
  ].filter(Boolean);

  return clamp(pieces.join(" "));
}

/**
 * A product's sentence.
 *
 * Every one is different because the piece and its position in the collection
 * are in it. Without this, nine sofas shared one fifteen-character line lifted
 * from the category tagline — nine pages a search engine sees as the same page.
 */
export function productDescription(
  product: Pick<Product, "name" | "note">,
  category: Category,
  position: number
): string {
  const pieces = [
    `${product.name}, ${position === 1 ? "the first" : `number ${position}`} of ${category.count} in the ${category.title.toLowerCase()} collection.`,
    category.story?.materials,
    "Sixteen weeks from order, quoted in writing on enquiry.",
  ].filter(Boolean);

  return clamp(pieces.join(" "));
}

// ----------------------------------------------------------- structured data --

/** The brand itself. Only fields the project actually holds. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.wordmark,
    url: siteUrl(),
    description: BRAND.tagline,
    // Deliberately no address, rating, price range or founding date: the
    // project holds none of those, and inventing them for a rich result is
    // exactly the kind of thing Google penalises — and should.
    slogan: BRAND.tagline,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.wordmark,
    url: siteUrl(),
    inLanguage: "en-GB",
    publisher: { "@type": "Organization", name: BRAND.wordmark, url: siteUrl() },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/** A category page, as the list of pieces it actually shows. */
export function collectionSchema(category: Category) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.title} — ${BRAND.wordmark}`,
    description: categoryDescription(category),
    url: absolute(`/collections/${category.slug}`),
    isPartOf: { "@type": "WebSite", name: BRAND.wordmark, url: siteUrl() },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.count,
      itemListElement: category.products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(`/collections/${category.slug}/${product.id}`),
        name: product.name,
      })),
    },
  };
}

/**
 * One piece.
 *
 * No `offers`, no price, no availability, no rating. The site quotes in writing
 * after an enquiry and says so; claiming a price or a stock level here would be
 * a lie told to a crawler, and it would cost the rich result anyway the moment
 * it was checked. What is left is true: a name, a photograph, a description, a
 * material and a brand.
 */
export function productSchema(
  product: Product,
  category: Category,
  description: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    description,
    image: [absolute(product.src)],
    url: absolute(`/collections/${category.slug}/${product.id}`),
    category: category.title,
    brand: { "@type": "Brand", name: BRAND.wordmark },
    ...(category.story?.materials ? { material: category.story.materials } : {}),
    isFamilyFriendly: true,
  };
}

/** Renders a JSON-LD block. One place, so the escaping is right every time. */
export function jsonLd(data: object) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}
