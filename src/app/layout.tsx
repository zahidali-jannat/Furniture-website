import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { SHARE_IMAGE, absolute, jsonLd, organizationSchema, siteUrl, websiteSchema } from "@/lib/seo";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const DESCRIPTION =
  "Slow furniture in oak, bouclé and stone. Made in small runs, meant to outlast the room it arrives in.";

export const metadata: Metadata = {
  // Every relative URL below — canonicals, share images, the sitemap — is
  // resolved against this. Without it Next emits relative og:image values,
  // which no social crawler will fetch.
  metadataBase: new URL(siteUrl()),

  // Pages set only their own half of the title; this supplies the rest, so the
  // brand is never typed twice or forgotten once.
  title: {
    default: `${BRAND.wordmark} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.wordmark}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND.wordmark,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.wordmark,
    locale: "en_GB",
    title: `${BRAND.wordmark} — ${BRAND.tagline}`,
    description: DESCRIPTION,
    url: siteUrl(),
    images: [{ url: absolute(SHARE_IMAGE), width: 1200, height: 630, alt: BRAND.tagline }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.wordmark} — ${BRAND.tagline}`,
    description: DESCRIPTION,
    images: [absolute(SHARE_IMAGE)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#f2efe9",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${sans.variable}`}>
      <body>
        {children}

        {/* Who the site belongs to and what it is, once, on every page. Both
            carry only fields the project actually holds — no address, no
            rating, no price range. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(organizationSchema())} />
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(websiteSchema())} />
      </body>
    </html>
  );
}
