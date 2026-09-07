/** Single source of truth for brand-level copy. Change the name here only. */
export const BRAND = {
  name: "MAISON NOIR",
  wordmark: "Maison Noir",
  tagline: "Furniture for rooms that hold their silence.",
  established: "Est. MMXIV",
  city: "Copenhagen — Kyoto",
} as const;

/**
 * Contact details.
 *
 * PHONE IS A PLACEHOLDER — replace it with the real business number and
 * everything that dials updates, because every caller goes through telHref().
 * Write it however reads best (spaces, dashes, brackets are all fine); the
 * tel: href is normalised to digits and an optional leading "+".
 */
export const CONTACT = {
  phone: "+91 7522844734",
  email: "studio@maisonnoir.example",
} as const;

/** The value shipped in this repo. Compared by identity so there are no false positives. */
const PLACEHOLDER_PHONE = "+91 00000 00000";

/**
 * True while the number is still the shipped placeholder.
 *
 * The cast is load-bearing: CONTACT is `as const`, so once a real number is set
 * the two literal types no longer overlap and TypeScript rejects the
 * comparison outright — which broke the build the first time this was edited.
 */
export const phoneIsPlaceholder = () => (CONTACT.phone as string) === PLACEHOLDER_PHONE;

/**
 * A tel: href tolerates only digits and one leading "+". Spaces and brackets
 * are silently dropped by some dialers and mis-parsed by others, so strip them
 * here rather than relying on the phone to be forgiving.
 */
export function telHref(raw: string = CONTACT.phone) {
  const plus = raw.trim().startsWith("+");
  return `tel:${plus ? "+" : ""}${raw.replace(/\D/g, "")}`;
}

export const NAV = [
  { label: "Collections", href: "/collections" },
  { label: "Lighting", href: "/collections/lighting" },
  { label: "Materials", href: "#materials" },
  { label: "Journal", href: "#homes" },
] as const;
