import { prisma } from "@/lib/db";
import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The enquiries this account has sent.
 *
 * Matched by user id and, for anything sent before they had an account, by the
 * verified address on the account. That second clause is why the address must
 * be verified to see this: without verification it would be a way to read
 * somebody else's correspondence by typing their address at registration.
 */
export async function GET() {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    const enquiries = await prisma.enquiry.findMany({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        product: { select: { slug: true, name: true, category: { select: { slug: true, title: true } } } },
      },
    });

    return noStore(
      ok({
        items: enquiries.map((row) => ({
          id: row.id,
          message: row.message,
          status: row.status,
          sentAt: row.createdAt.toISOString(),
          product: row.product,
        })),
      })
    );
  } catch (err) {
    return noStore(serverError("enquiries:list", err));
  }
}
