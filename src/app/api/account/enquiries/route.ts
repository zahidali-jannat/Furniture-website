import { fail, guardSubject, invalid, noStore, ok, readJson, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { createEnquiry, listEnquiries } from "@/lib/account/enquiries";
import { accountEnquirySchema } from "@/lib/account/validation";
import { ensureProduct } from "@/lib/catalogue-db";
import { sendMail } from "@/lib/email/mailer";

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
    const enquiries = await listEnquiries(user);

    return noStore(
      ok({
        items: enquiries.map((row) => ({
          reference: row.reference,
          subject: row.subject,
          message: row.message,
          status: row.status,
          sentAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
          answered: Boolean(row.respondedAt),
          product: row.product
            ? { slug: row.product.slug, name: row.product.name, category: row.product.category }
            : null,
        })),
      })
    );
  } catch (err) {
    return noStore(serverError("enquiries:list", err));
  }
}

/**
 * Starts one from inside the account — usually from a saved piece.
 *
 * The details come from the session rather than the request: the address an
 * enquiry is filed under is the one we have already proved, not one supplied
 * alongside the message.
 */
export async function POST(req: Request) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  const limited = guardSubject(`enquiry:${user.id}`, 10, 60 * 60 * 1000);
  if (limited) return noStore(limited);

  const parsed = accountEnquirySchema.safeParse(await readJson(req));
  if (!parsed.success) return noStore(invalid(parsed.error));

  try {
    const productId = parsed.data.productSlug
      ? await ensureProduct(parsed.data.productSlug)
      : null;

    if (parsed.data.productSlug && !productId) {
      return noStore(fail(404, "We cannot find that piece.", { code: "unknown" }));
    }

    const enquiry = await createEnquiry({
      userId: user.id,
      email: user.email,
      name: user.fullName,
      phone: user.phone,
      subject: parsed.data.subject ?? null,
      message: parsed.data.message,
      productId,
    });

    const inbox = process.env.MAIL_NOTIFY_TO;
    if (inbox) {
      sendMail({
        to: inbox,
        subject: `Enquiry ${enquiry.reference} — ${user.fullName}`,
        html: `<p><strong>${escapeHtml(user.fullName)}</strong> (${escapeHtml(user.email)}) wrote:</p><p>${escapeHtml(parsed.data.message)}</p>`,
        text: `${user.fullName} (${user.email}) wrote:\n\n${parsed.data.message}`,
        replyTo: user.email,
      }).catch((err) => console.error("[mail] enquiry notice failed", err));
    }

    return noStore(ok({ enquiry }));
  } catch (err) {
    return noStore(serverError("enquiries:create", err));
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
