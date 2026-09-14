import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { Empty, PageHeading } from "@/components/account/Panels";
import SavedGrid, { type SavedItem } from "@/components/account/SavedGrid";
import { getCategory } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

/** Everything this account has set aside, newest first. */
export default async function SavedPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const saved = await prisma.savedProduct.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      note: true,
      product: {
        select: {
          slug: true,
          name: true,
          note: true,
          category: { select: { slug: true, title: true } },
          images: {
            where: { primary: true },
            take: 1,
            select: { url: true, width: true, height: true },
          },
        },
      },
    },
  });

  const items: SavedItem[] = saved.map((row) => ({
    slug: row.product.slug,
    name: row.product.name,
    note: row.note ?? row.product.note,
    // Materials are written per category in the folder catalogue rather than
    // per piece, so they come from there rather than from the mirror.
    material: getCategory(row.product.category.slug)?.story?.materials ?? null,
    categorySlug: row.product.category.slug,
    categoryTitle: row.product.category.title,
    image: row.product.images[0] ?? null,
    savedAt: row.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeading
        eyebrow="Saved pieces"
        title="Pieces you are"
        italic="thinking about."
        intro={
          items.length > 0
            ? "Kept here until you decide. Nothing is reserved and nothing expires — ask about any of them and the enquiry arrives with the piece attached."
            : undefined
        }
        aside={
          items.length > 0 ? (
            <p className="text-[0.85rem] text-charcoal/65">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </p>
          ) : null
        }
      />

      {items.length === 0 ? (
        <Empty
          line="You have not saved any pieces yet."
          cta={
            <div className="space-y-6">
              <p className="mx-auto max-w-sm text-[0.92rem] leading-relaxed text-charcoal/65">
                Save furniture that speaks to your space and return to it whenever you are ready.
              </p>
              <Link
                href="/collections"
                className="eyebrow inline-block border border-charcoal/25 px-7 py-3.5 text-[0.74rem] text-charcoal transition-colors duration-700 hover:border-charcoal"
              >
                Explore collections
              </Link>
            </div>
          }
        />
      ) : (
        <SavedGrid items={items} />
      )}
    </div>
  );
}
