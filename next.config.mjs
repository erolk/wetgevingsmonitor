/** @type {import('next').NextConfig} */

// Content-Security-Policy. De site laadt client-side alléén eigen resources
// (geen externe scripts, fonts of afbeeldingen) plus inline scripts/styles die
// Next.js en Tailwind nodig hebben. Daarom kan het CSP streng zijn op de
// gevaarlijke richtlijnen (frame-ancestors, base-uri, object-src, form-action)
// en alleen 'unsafe-inline' toestaan waar Next.js dat technisch vereist.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Forceer HTTPS voor twee jaar, ook op subdomeinen.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Browser mag het content-type niet zelf "raden" (anti MIME-sniffing).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // De site mag niet in een iframe op een andere site geladen worden
  // (anti-clickjacking). frame-ancestors in het CSP doet hetzelfde; dit is
  // de fallback voor oudere browsers.
  { key: "X-Frame-Options", value: "DENY" },
  // Stuur de volledige URL alleen mee binnen de eigen site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Zet browser-features uit die de site niet gebruikt.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: true,
  // Verberg de "X-Powered-By: Next.js" header (geeft minder weg over de stack).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
