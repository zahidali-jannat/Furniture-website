import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { verifiedUser } from "@/lib/auth/session";
import { getEnquiry } from "@/lib/account/enquiries";
import { tidyReference } from "@/lib/account/reference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One enquiry, scoped to the person who sent it. */
export async function GET(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const user = await verifiedUser();
  if (!user) return noStore(fail(401, "Please sign in.", { code: "anonymous" }));

  try {
    const enquiry = await getEnquiry(user, tidyReference((await params).reference));
    if (!enquiry) return noStore(fail(404, "We cannot find that enquiry."));

    return noStore(ok({ enquiry }));
  } catch (err) {
    return noStore(serverError("enquiries:get", err));
  }
}
