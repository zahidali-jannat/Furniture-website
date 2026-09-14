import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { Empty } from "@/components/account/Panels";
import { QuietButton } from "@/components/account/Buttons";
import SavedGrid, { type SavedItem } from "@/components/account/SavedGrid";

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
          images: { where: { primary: true }, take: 1, select: { url: true, width: true, height: true } },
        },
      },
    },
  });

  const items: SavedItem[] = saved.map((row) => ({
    slug: row.product.slug,
    name: row.product.name,
    note: row.note ?? row.product.note,
    categorySlug: row.product.category.slug,
    categoryTitle: row.product.category.title,
    image: row.product.images[0] ?? null,
    savedAt: row.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow text-[0.6rem] text-charcoal/40">Saved</p>
        <h1 className="display mt-6 text-[clamp(2.2rem,5vw,3.4rem)] leading-[0.98] text-charcoal">
          Pieces you are
          <br />
          <em className="font-normal italic">thinking about.</em>
        </h1>
        <p className="mt-6 max-w-lg text-[0.9rem] leading-relaxed text-charcoal/50">
          {items.length > 0
            ? "Kept here until you decide. Nothing is reserved and nothing expires."
            : "Nothing here yet."}
        </p>
      </header>

      {items.length === 0 ? (
        <Empty
          line="When you find something worth coming back to, save it and it will be waiting here."
          cta={
            <Link href="/collections">
              <QuietButton type="button">Explore the collection</QuietButton>
            </Link>
          }
        />
      ) : (
        <SavedGrid items={items} />
      )}
    </div>
  );
}
