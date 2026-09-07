/**
 * Builds the product catalogue from the folder structure under image/.
 *
 * Every subdirectory is a category; every image inside it is a product. No
 * product is named in code — add a folder, drop images in, re-run, and it
 * appears. A folder with no images still appears, marked "in preparation", so
 * the published range reads as complete rather than silently missing an entry.
 *
 * Source filenames are not trusted for anything user-visible: the real ones
 * include spaces, parentheses and a "#", which would break a URL. Products are
 * numbered in stable filename order and addressed as "<category>-01".
 *
 * Copy can be supplied per category by dropping a _meta.json beside the images:
 *
 *   {
 *     "title": "Sofas",
 *     "tagline": "Curated seating",
 *     "intro": "A study in comfort, proportion and material.",
 *     "products": { "sofa-01": { "name": "Halden", "note": "Bouclé over ash" } }
 *   }
 */
import { mkdir, readdir, writeFile, stat, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "image");
const OUT = path.join(ROOT, "public", "collections");

const IMAGE_RE = /\.(jpe?g|jfif|png|webp|avif)$/i;

/**
 * The organising principle: what a piece is *for*.
 *
 * People arrive knowing they need somewhere to sit or somewhere to put things,
 * not knowing which folder a wardrobe lives in. Grouping by function gives one
 * stated model that covers every category, and an unrecognised folder still
 * lands somewhere sensible rather than breaking the scheme.
 */
export const GROUPS = [
  { key: "seating", slug: "seating", title: "Seating", blurb: "Where you sit.",
    intro: "Sofas, chairs and anything else that takes your weight." },
  { key: "surfaces", slug: "surfaces", title: "Surfaces", blurb: "Where things rest.",
    intro: "Tables and the smaller surfaces that gather around them." },
  { key: "storage", slug: "storage", title: "Storage", blurb: "Where things live.",
    intro: "Joinery meant to disappear into the architecture." },
  { key: "rest", slug: "rest", title: "Rest", blurb: "Where the day is set down.",
    intro: "Beds and the quiet rooms they belong to." },
  { key: "light", slug: "lighting", title: "Lighting", blurb: "How the room reads after dark.",
    intro: "Light treated as a material — hung, aimed and dimmed like any other surface." },
  { key: "rooms", slug: "rooms", title: "Rooms", blurb: "Complete interiors, for reference.",
    intro: "Rooms photographed as they are lived in." },
  { key: "more", slug: "more", title: "More", blurb: "Everything else.", intro: "" },
];

const GROUP_OF = {
  sofa: "seating", sofas: "seating", chair: "seating", chairs: "seating",
  bench: "seating", benches: "seating", stool: "seating", stools: "seating",
  table: "surfaces", tables: "surfaces", dining: "surfaces", desk: "surfaces",
  desks: "surfaces", side_table: "surfaces", "side-table": "surfaces",
  "side-tables": "surfaces", "side_tables": "surfaces",
  wardrobe: "storage", wardrobes: "storage", almira: "storage",
  almirah: "storage", cabinet: "storage", cabinets: "storage",
  sideboard: "storage", sideboards: "storage",
  bed: "rest", beds: "rest",
  lighting: "light", lights: "light", lamp: "light", lamps: "light",
  // "chandilier" is how the folder is actually spelled on disk.
  chandelier: "light", chandeliers: "light", chandilier: "light", chandiliers: "light",
  pendant: "light", pendants: "light",
  interior: "rooms", interiors: "rooms",
};

/**
 * Display names and editorial copy per category. Category-level only — it never
 * names a product. An unknown folder falls back to a title-cased plural, so it
 * still reads correctly without touching this file.
 */
const LEXICON = {
  sofa: {
    title: "Sofas", tagline: "Curated seating",
    intro: "A study in comfort, proportion and material.",
    story: {
      headline: "Designed to anchor the room.",
      materials: "Kiln-dried hardwood frames, feather-down seats, upholstery in wool, bouclé or velvet.",
      space: "For long rooms, and longer evenings.",
    },
  },
  sofas: { title: "Sofas", tagline: "Curated seating", intro: "A study in comfort, proportion and material." },
  chair: {
    title: "Chairs", tagline: "Comfort and character",
    intro: "Where posture, weight and hand meet.",
    story: {
      headline: "The piece you notice last and use most.",
      materials: "Solid oak and ash, shaped by hand where the hand lands.",
      space: "For a reading corner, a desk, the head of a table.",
    },
  },
  chairs: { title: "Chairs", tagline: "Comfort and character", intro: "Where posture, weight and hand meet." },
  table: { title: "Tables", tagline: "Crafted for gathering", intro: "Surfaces built to carry years of use." },
  tables: { title: "Tables", tagline: "Crafted for gathering", intro: "Surfaces built to carry years of use." },
  side_table: {
    title: "Side Tables", tagline: "The quiet companion",
    intro: "Small forms, considered at every edge.",
    story: { headline: "The quiet companion.", materials: "", space: "" },
  },
  "side-table": { title: "Side Tables", tagline: "The quiet companion", intro: "Small forms, considered at every edge." },
  "side-tables": { title: "Side Tables", tagline: "The quiet companion", intro: "Small forms, considered at every edge." },
  wardrobe: { title: "Wardrobes", tagline: "Refined storage", intro: "Storage that disappears into the architecture." },
  wardrobes: { title: "Wardrobes", tagline: "Refined storage", intro: "Storage that disappears into the architecture." },
  almira: {
    title: "Wardrobes", tagline: "Refined storage",
    intro: "Storage that disappears into the architecture.",
    story: {
      headline: "Storage that disappears into the wall.",
      materials: "Veneered panels, soft-close joinery, handles turned by hand or left off entirely.",
      space: "For bedrooms where the architecture should speak first.",
    },
  },
  almirah: { title: "Wardrobes", tagline: "Refined storage", intro: "Storage that disappears into the architecture." },
  bed: {
    title: "Beds", tagline: "The quietest room",
    intro: "Where the day is set down.",
    story: {
      headline: "Where the day is set down.",
      materials: "Upholstered platforms on low frames, in linen and undyed wool.",
      space: "For rooms kept deliberately quiet.",
    },
  },
  beds: { title: "Beds", tagline: "The quietest room", intro: "Where the day is set down." },
  cabinet: { title: "Cabinets", tagline: "Considered storage", intro: "Joinery meant to be opened daily." },
  cabinets: { title: "Cabinets", tagline: "Considered storage", intro: "Joinery meant to be opened daily." },
  dining: { title: "Dining", tagline: "The long table", intro: "Made for the hours after the meal." },
  lighting: { title: "Lighting", tagline: "The second material", intro: "Light as a surface, not a fixture." },
  chandelier: { slug: "chandeliers", title: "Chandeliers", tagline: "Held light", intro: "Light gathered into a single object." },
  chandilier: {
    // The folder is misspelled; the published URL should not be.
    slug: "chandeliers",
    title: "Chandeliers", tagline: "Held light",
    intro: "Light gathered into a single object, hung where the room can carry it.",
    story: {
      headline: "The one thing a room looks up at.",
      materials: "Hand-blown glass and cut crystal on brass or blackened steel armatures.",
      space: "For stairwells, long tables and double-height rooms.",
    },
  },
  interior: {
    title: "Interiors", tagline: "Rooms in full",
    intro: "Complete rooms, photographed as they are lived in.",
    story: {
      headline: "The pieces, in place.",
      materials: "Complete installations, photographed as they are lived in.",
      space: "Reference rather than a range.",
    },
  },
};

const slug = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (s) =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();

/** Natural sort so "10" follows "9" rather than "1". */
const natural = (a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });

async function readMeta(dir) {
  try {
    return JSON.parse(await readFile(path.join(dir, "_meta.json"), "utf8"));
  } catch {
    return {};
  }
}

export async function buildCatalogue() {
  let entries;
  try {
    entries = await readdir(SRC, { withFileTypes: true });
  } catch {
    console.warn("[catalogue] no image/ directory — nothing to build");
    return [];
  }

  const categories = [];
  const skipped = [];

  for (const dir of entries.filter((e) => e.isDirectory()).sort((a, b) => natural(a.name, b.name))) {
    const from = path.join(SRC, dir.name);
    const files = (await readdir(from)).filter((f) => IMAGE_RE.test(f)).sort(natural);

    const key = dir.name.toLowerCase();
    const lex = LEXICON[key] ?? {};
    const meta = await readMeta(from);
    const catSlug = slug(meta.slug ?? lex.slug ?? dir.name);
    const group = meta.group ?? GROUP_OF[key] ?? "more";

    // An empty folder still appears, marked as not yet available. Hiding it
    // leaves a hole in the model — the reader cannot tell whether we do not
    // make the thing or simply have no photograph of it.
    if (!files.length) {
      skipped.push(dir.name);
      categories.push({
        slug: catSlug,
        title: meta.title ?? lex.title ?? titleCase(dir.name),
        tagline: meta.tagline ?? lex.tagline ?? "In preparation",
        intro: meta.intro ?? lex.intro ?? "",
        group,
        story: meta.story ?? lex.story ?? null,
        count: 0,
        cover: null,
        coverWidth: 0,
        coverHeight: 0,
        products: [],
      });
      continue;
    }

    const outDir = path.join(OUT, catSlug);
    await mkdir(outDir, { recursive: true });

    const products = [];
    for (const [i, file] of files.entries()) {
      const id = `${catSlug}-${String(i + 1).padStart(2, "0")}`;
      const outFile = path.join(outDir, `${id}.jpg`);

      // .jfif is JPEG with a Windows extension; sharp sniffs content, not name.
      const img = sharp(path.join(from, file), { limitInputPixels: false }).rotate();
      const meta1 = await img.metadata();
      await img
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(outFile);

      const out = await sharp(outFile).metadata();
      const { size } = await stat(outFile);
      const override = meta.products?.[id] ?? {};

      products.push({
        id,
        name: override.name ?? `${(lex.title ?? titleCase(dir.name)).replace(/s$/, "")} No. ${String(i + 1).padStart(2, "0")}`,
        note: override.note ?? lex.tagline ?? titleCase(dir.name),
        src: `/collections/${catSlug}/${id}.jpg`,
        width: out.width,
        height: out.height,
        portrait: out.height >= out.width,
        kb: Math.round(size / 1024),
        source: `${dir.name}/${file}`,
        sourceSize: `${meta1.width}x${meta1.height}`,
      });
    }

    categories.push({
      slug: catSlug,
      title: meta.title ?? lex.title ?? titleCase(dir.name),
      tagline: meta.tagline ?? lex.tagline ?? "The collection",
      intro: meta.intro ?? lex.intro ?? `The ${titleCase(dir.name).toLowerCase()} collection.`,
      group,
      story: meta.story ?? lex.story ?? null,
      count: products.length,
      // Intrinsic size travels with the cover so it can be rendered at its own
      // proportions rather than poured into a fixed frame.
      ...(() => {
        const c = products.find((p) => !p.portrait) ?? products[0];
        return { cover: c.src, coverWidth: c.width, coverHeight: c.height };
      })(),
      products,
    });
  }

  // Ordered by the group scheme, then by size within a group, so the page never
  // depends on the order the filesystem happened to list the folders in.
  const order = new Map(GROUPS.map((g, i) => [g.key, i]));
  categories.sort(
    (a, b) =>
      order.get(a.group) - order.get(b.group) ||
      b.count - a.count ||
      natural(a.title, b.title)
  );

  await writeFile(
    path.join(ROOT, "src", "lib", "catalogue.generated.json"),
    JSON.stringify({ groups: GROUPS, categories }, null, 2) + "\n"
  );

  console.table(
    categories.map((c) => ({
      group: c.group,
      category: c.slug,
      title: c.title,
      products: c.count,
      kb: c.products.reduce((a, p) => a + p.kb, 0),
    }))
  );
  if (skipped.length) console.log(`  awaiting images: ${skipped.join(", ")}`);
  console.log("  wrote src/lib/catalogue.generated.json");
  return categories;
}

if (import.meta.filename === process.argv[1]) await buildCatalogue();
