// Eenvoudige in-memory rate limiter (vast venster per sleutel, meestal per IP).
// Bedoeld tegen spam-floods op publieke POST-endpoints (contact, abonneren).
//
// Let op: in-memory = per server-instance. Op een vaste host (VPS) werkt dit
// goed; op serverless met meerdere/koude instances vangt het alleen snelle
// bursts binnen één instance. Voor zwaardere garanties is een gedeelde store
// (Redis/KV) nodig — maar voor een informatiesite is dit een prima basis.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let laatsteSchoonmaak = 0;

function schoonmaak(now: number) {
  // Hooguit eens per minuut verlopen entries opruimen (voorkomt geheugengroei).
  if (now - laatsteSchoonmaak < 60_000) return;
  laatsteSchoonmaak = now;
  for (const [key, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(key);
  }
}

export type RateLimitResultaat = { ok: boolean; retryAfterSec: number };

export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): RateLimitResultaat {
  const now = Date.now();
  schoonmaak(now);

  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (b.count >= opts.max) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true, retryAfterSec: 0 };
}

/** Haalt het client-IP uit de gangbare proxy-headers. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "onbekend"
  );
}
