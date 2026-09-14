/**
 * Pushes the folder-built catalogue into Postgres.
 *
 * The folders remain the source of truth — this only mirrors them, so that a
 * saved piece or an enquiry can point at a real row. Run it after
 * `npm run catalogue`, or run `npm run prep:assets` which does both.
 *
 *   node scripts/sync-catalogue.mjs
 *
 * It is idempotent: every write is an upsert keyed on the catalogue's own
 * slugs, and nothing is ever deleted. A piece withdrawn from the folders keeps
 * its row so that somebody's saved list does not develop a hole where a sofa
 * used to be.
 *
 * This deliberately duplicates a little of src/lib/catalogue-db.ts rather than
 * importing it: that module is part of the server bundle and imports through
 * the "@/" alias, neither of which a plain node script can resolve. The two
 * must agree, so keep them in step.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cataloguePath = path.join(root, "src/lib/catalogue.generated.json");

// Next loads these for the app; a plain node script has to ask.
loadEnv({ path: [path.join(root, ".env.local"), path.join(root, ".env")], quiet: true });

const prisma = process.env.DATABASE_URL
  ? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  : null;

async function main() {
  if (!prisma) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres database."
    );
    process.exitCode = 1;
    return;
  }

  const { groups, categories } = JSON.parse(readFileSync(cataloguePath, "utf8"));

  const collectionIds = new Map();
  let position = 0;
  for (const group of groups) {
    const row = await prisma.collection.upsert({
      where: { key: group.key },
      create: {
        key: group.key,
        slug: group.slug,
        title: group.title,
        blurb: group.blurb ?? "",
        intro: group.intro ?? "",
        position: position++,
      },
      update: {
        slug: group.slug,
        title: group.title,
        blurb: group.blurb ?? "",
        intro: group.intro ?? "",
      },
      select: { id: true },
    });
    collectionIds.set(group.key, row.id);
  }

  let products = 0;
  let images = 0;

  for (const category of categories) {
    const categoryRow = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        title: category.title,
        tagline: category.tagline ?? "",
        intro: category.intro ?? "",
        cover: category.cover ?? null,
        collectionId: collectionIds.get(category.group) ?? null,
      },
      update: {
        title: category.title,
        tagline: category.tagline ?? "",
        intro: category.intro ?? "",
        cover: category.cover ?? null,
        collectionId: collectionIds.get(category.group) ?? null,
      },
      select: { id: true },
    });

    for (const [index, product] of category.products.entries()) {
      const productRow = await prisma.product.upsert({
        where: { slug: product.id },
        create: {
          slug: product.id,
          name: product.name,
          note: product.note ?? "",
          categoryId: categoryRow.id,
          position: index,
        },
        update: {
          name: product.name,
          note: product.note ?? "",
          categoryId: categoryRow.id,
          position: index,
        },
        select: { id: true },
      });
      products += 1;

      const existing = await prisma.productImage.findFirst({
        where: { productId: productRow.id, url: product.src },
        select: { id: true },
      });

      if (existing) {
        await prisma.productImage.update({
          where: { id: existing.id },
          data: {
            width: product.width,
            height: product.height,
            alt: product.name,
            primary: true,
          },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: productRow.id,
            url: product.src,
            width: product.width,
            height: product.height,
            alt: product.name,
            primary: true,
            position: 0,
          },
        });
      }
      images += 1;
    }
  }

  console.log(
    `Catalogue mirrored: ${collectionIds.size} collections, ${categories.length} categories, ${products} products, ${images} images.`
  );
}

main()
  .catch((err) => {
    console.error("Catalogue sync failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma?.$disconnect());
