import { fail, noStore, ok, serverError } from "@/lib/auth/http";
import { currentUser } from "@/lib/auth/session";
import { publicUser } from "@/lib/auth/shape";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in visitor, or 401. Never cached, never shared. */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return noStore(fail(401, "Not signed in.", { code: "anonymous" }));

    return noStore(ok({ user: publicUser(user) }));
  } catch (err) {
    return noStore(serverError("me", err));
  }
}
