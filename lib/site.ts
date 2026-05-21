// Centrale site-instellingen.

/** De Europese zustersite (EU-wetgevingsmonitor). Overschrijfbaar via env. */
export const EU_MONITOR_URL = (
  process.env.NEXT_PUBLIC_EU_MONITOR_URL ??
  "https://eu-wetgevingsmonitor.vercel.app"
).replace(/\/$/, "");
