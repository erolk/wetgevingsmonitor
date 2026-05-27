// Centrale site-instellingen.

/** De Europese zustersite (EU-wetgevingsmonitor). Overschrijfbaar via env. */
export const EU_MONITOR_URL = (
  process.env.NEXT_PUBLIC_EU_MONITOR_URL ??
  "https://eu-wetgevingsmonitor.vercel.app"
).replace(/\/$/, "");

/** Canonieke publieke URL van de site (voor SEO: canonical, sitemap, OG). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetgevingsmonitor.nl"
).replace(/\/$/, "");

/**
 * Betaallink voor donaties (Mollie/Stripe Payment Link, Buy Me a Coffee,
 * Tikkie, ...). Leeg = de steunpagina toont "binnenkort". Zet de eigen link
 * via NEXT_PUBLIC_DONATE_URL. Bewust een externe link: geen betaal-backend of
 * geheimen in deze app nodig, werkt op elke host.
 */
export const DONATE_URL = (process.env.NEXT_PUBLIC_DONATE_URL ?? "").trim();
