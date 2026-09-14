import type { MetadataRoute } from "next";
import { getCategories, getGroups } from "@/lib/catalogue";
import { absolute } from "@/lib/seo";

/**
 * The sitemap, built from the folders.
 *
 * Every URL here is generated from the same catalogue the pages are, so it
 * cannot drift: add a photograph to a folder, run the catalogue script, and the
 * piece appears on the site and in this list together. Nothing is listed by
 * hand, and a category with no photographs yet is left out rather than offered
 * as an empty page.
 *
 * The account area, the sign-in flows and the API are absent on purpose — they
 * are private, and robots.ts disallows them besides.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const categories = getCategories();

  const entries: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absolute("/collections"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: absolute("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
  ];

  // The middle level: seating, lighting, storage.
  for (const group of getGroups()) {
    entries.push({
      url: absolute(`/collections/${group.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  // Furniture types, then the pieces themselves.
  for (const category of categories) {
    entries.push({
      url: absolute(`/collections/${category.slug}`),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });

    for (const product of category.products) {
      entries.push({
        url: absolute(`/collections/${category.slug}/${product.id}`),
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
