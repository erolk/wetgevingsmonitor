// Lichte auth voor het admin-panel: één wachtwoord (env-var) + een
// ondertekend, vervalbaar sessie-cookie. Bewust géén database/gebruikers.
//
// We gebruiken Web Crypto (HMAC-SHA256) zodat dezelfde code werkt in de Node-
// runtime (server actions, route handlers) én in de Edge-runtime (middleware).
//
// Fail-closed: zonder ADMIN_PASSWORD én ADMIN_SESSION_SECRET kan niemand in.

export const ADMIN_COOKIE = "vhm_admin";
const SESSIE_DUUR_SEC = 60 * 60 * 8; // 8 uur

function env() {
  return {
    wachtwoord: process.env.ADMIN_PASSWORD ?? "",
    secret: process.env.ADMIN_SESSION_SECRET ?? "",
  };
}

/** Is de admin überhaupt geconfigureerd? Zonder dit blijft alles dicht. */
export function adminGeconfigureerd(): boolean {
  const { wachtwoord, secret } = env();
  return wachtwoord.length > 0 && secret.length >= 16;
}

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(payload: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return new Uint8Array(sig);
}

function constantTimeGelijk(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Controleer het ingevoerde wachtwoord (constant-time). */
export function wachtwoordKlopt(invoer: string): boolean {
  const { wachtwoord } = env();
  if (!wachtwoord) return false;
  return constantTimeGelijk(invoer, wachtwoord);
}

/** Maak een ondertekend sessietoken: base64url(payload).base64url(hmac). */
export async function maakSessieToken(): Promise<string> {
  const { secret } = env();
  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSIE_DUUR_SEC,
  });
  const payloadEnc = base64url(new TextEncoder().encode(payload));
  const sig = base64url(await hmac(payloadEnc, secret));
  return `${payloadEnc}.${sig}`;
}

/** Verifieer een sessietoken: handtekening klopt én niet verlopen. */
export async function sessieGeldig(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const { secret } = env();
  if (!secret) return false;
  const [payloadEnc, sig] = token.split(".");
  if (!payloadEnc || !sig) return false;
  const verwacht = base64url(await hmac(payloadEnc, secret));
  if (!constantTimeGelijk(sig, verwacht)) return false;
  try {
    const { exp } = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadEnc)),
    );
    return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const SESSIE_DUUR_SECONDEN = SESSIE_DUUR_SEC;
