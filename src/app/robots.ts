import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

/**
 * What a crawler may read.
 *
 * Everything public is open, including the images — this is a furniture brand,
 * and the photographs are half of what people search for. What is closed is
 * closed because it is private or pointless to index: somebody's account, the
 * sign-in flows, and the API.
 *
 * Written as a route rather than a file in public/ so the sitemap URL is built
 * from the same origin as every canonical on the site, instead of being typed
 * out once and going stale at the first domain change.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account",
          "/account/",
          "/login",
          "/create-account",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: absolute("/sitemap.xml"),
    host: absolute("/"),
  };
}
