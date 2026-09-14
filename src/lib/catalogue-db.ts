import "server-only";
import { prisma } from "@/lib/db";
import { getAllCategories, groupOf, type Category } from "@/lib/catalogue";

/**
 * Mirrors the folder-built catalogue into Postgres.
 *
 * The folders stay the source of truth — COLLECTIONS.md is still the whole
 * story of how a piece gets onto the site, and the public pages still read the
 * generated JSON, so browsing costs no queries and survives the database being
 * down. What the mirror buys is referential integrity for the things an
 * account owns: a favourite points at a product row, an enquiry points at the
 * piece it was sent from, and neither can end up pointing at nothing.
 *
 * Upserts, never deletes. A piece withdrawn from the catalogue keeps its row so
 * that somebody's saved list does not develop a hole where a sofa used to be.
 */

type CatalogueProduct = Category["products"][number];

export async function syncCatalogue(): Promise<{
  collections: number;
  categories: number;
  products: number;
}> {
  const categories = getAllCategories();
  const collections = new Map<string, string>();
  let productCount = 0;

  for (const [index, category] of categories.entries()) {
    const collectionId = await ensureCollection(category, collections, index);

    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: categoryData(category, collectionId),
      update: categoryData(category, collectionId),
      select: { id: true },
    });

    for (const [position, product] of category.products.entries()) {
      await upsertProduct(row.id, product, position);
      productCount += 1;
    }
  }

  return { collections: collections.size, categories: categories.length, products: productCount };
}

function categoryData(category: Category, collectionId: string | null) {
  return {
    slug: category.slug,
    title: category.title,
    tagline: category.tagline ?? "",
    intro: category.intro ?? "",
    cover: category.cover,
    collectionId,
  };
}

async function ensureCollection(
  category: Category,
  cache: Map<string, string>,
  position: number
): Promise<string | null> {
  const group = groupOf(category.slug);
  if (!group) return null;

  const cached = cache.get(group.key);
  if (cached) return cached;

  const row = await prisma.collection.upsert({
    where: { key: group.key },
    create: {
      key: group.key,
      slug: group.slug,
      title: group.title,
      blurb: group.blurb ?? "",
      intro: group.intro ?? "",
      position,
    },
    update: { slug: group.slug, title: group.title, blurb: group.blurb ?? "", intro: group.intro ?? "" },
    select: { id: true },
  });

  cache.set(group.key, row.id);
  return row.id;
}

async function upsertProduct(categoryId: string, product: CatalogueProduct, position: number) {
  const row = await prisma.product.upsert({
    where: { slug: product.id },
    create: {
      slug: product.id,
      name: product.name,
      note: product.note ?? "",
      categoryId,
      position,
    },
    update: { name: product.name, note: product.note ?? "", categoryId, position },
    select: { id: true },
  });

  // One photograph per piece today. Written as a collection so a second angle
  // is a row rather than a migration.
  const existing = await prisma.productImage.findFirst({
    where: { productId: row.id, url: product.src },
    select: { id: true },
  });

  if (existing) {
    await prisma.productImage.update({
      where: { id: existing.id },
      data: { width: product.width, height: product.height, alt: product.name, primary: true },
    });
  } else {
    await prisma.productImage.create({
      data: {
        productId: row.id,
        url: product.src,
        width: product.width,
        height: product.height,
        alt: product.name,
        primary: true,
        position: 0,
      },
    });
  }

  return row.id;
}

/**
 * The product row for a catalogue slug, created on demand.
 *
 * Favouriting a piece should not depend on somebody having remembered to run
 * the sync script, and the generated catalogue is right there. Returns null
 * for a slug that is not in the catalogue at all — which is what an id
 * invented by hand looks like.
 */
export async function ensureProduct(slug: string): Promise<string | null> {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;

  const found = locate(slug);
  if (!found) return null;

  const collectionId = await ensureCollection(found.category, new Map(), 0);

  const categoryRow = await prisma.category.upsert({
    where: { slug: found.category.slug },
    create: categoryData(found.category, collectionId),
    update: {},
    select: { id: true },
  });

  return upsertProduct(categoryRow.id, found.product, found.position);
}

function locate(slug: string) {
  for (const category of getAllCategories()) {
    const position = category.products.findIndex((p) => p.id === slug);
    if (position >= 0) return { category, product: category.products[position], position };
  }
  return null;
}
