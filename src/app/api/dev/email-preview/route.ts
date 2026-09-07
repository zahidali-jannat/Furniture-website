import { NextResponse } from "next/server";
import { confirmationHtml } from "@/lib/email/template";

/**
 * Renders the confirmation email in the browser. Development only — it exists
 * so the template can be reviewed and reused by scripts without duplicating it.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(confirmationHtml(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
