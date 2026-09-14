import { noStore, ok, serverError } from "@/lib/auth/http";
import { endSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Signs this device out.
 *
 * POST rather than GET so that an image tag on another site cannot do it, and
 * so a link prefetcher cannot end somebody's session by hovering. Other
 * devices are left alone — "sign out everywhere" is a separate, deliberate
 * action in the dashboard.
 */
export async function POST() {
  try {
    await endSession();
    return noStore(ok({ next: "/" }));
  } catch (err) {
    return noStore(serverError("logout", err));
  }
}
