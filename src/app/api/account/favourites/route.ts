import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { savedProductSchema } from "@/lib/auth/validation";
import { ensureProduct } from "@/lib/catalogue-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Saved pieces.
 *
 * Every handler here starts from `verifiedUser()` and scopes its query by that
 * id. There is no route that takes a user id from the request — the id comes
 * from the session or the request does not happen, which is what keeps one
 * person's saved list out of another person's reach.
 */

export async function GET() {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
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
              select: { url: true, width: true, height: true, alt: true },
            },
          },
        },
      },
    });

    return noStore(
      ok({
        items: saved.map((row) => ({
          slug: row.product.slug,
          name: row.product.name,
          note: row.note ?? row.product.note,
          category: row.product.category,
          image: row.product.images[0] ?? null,
          savedAt: row.createdAt.toISOString(),
        })),
      })
    );
  } catch (err) {
    return noStore(serverError("favourites:list", err));
  }
}

export async function POST(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`favourites:${user.id}`, 60, 10 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = savedProductSchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  try {
    const productId = await ensureProduct(parsed.data.productSlug);
    if (!productId) return noStore(fail(404, "We cannot find that piece.", { code: "unknown" }));

    await prisma.savedProduct.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, note: parsed.data.note ?? null },
      // Saving something twice is not an error; it is a double-click.
      update: { note: parsed.data.note ?? undefined },
    });

    return noStore(ok({ saved: true }));
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return noStore(ok({ saved: true }));
    }
    return noStore(serverError("favourites:add", err));
  }
}

export async function DELETE(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return noStore(fail(422, "Which piece?"));

  try {
    // deleteMany rather than delete: it scopes by user id in the same
    // statement and does not throw when the row is already gone.
    await prisma.savedProduct.deleteMany({
      where: { userId: user.id, product: { slug } },
    });

    return noStore(ok({ saved: false }));
  } catch (err) {
    return noStore(serverError("favourites:remove", err));
  }
}
