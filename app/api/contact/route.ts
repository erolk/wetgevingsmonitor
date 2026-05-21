import { NextResponse } from "next/server";
import { createContactMessage } from "@/lib/contact";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function valideerEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  // Max 5 berichten per IP per 10 minuten — tegen spam-floods.
  const ip = clientIp(req);
  const rl = rateLimit(`contact:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Te veel berichten verstuurd. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: {
    naam?: string;
    email?: string;
    bericht?: string;
    avg?: boolean;
    website?: string; // honeypot
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { naam, email, bericht, avg, website } = body;

  if (typeof website === "string" && website.trim() !== "") {
    return NextResponse.json({ ok: true, bericht: "Bedankt." });
  }

  if (!naam || naam.trim().length < 2) {
    return NextResponse.json(
      { error: "Vul je naam in (minimaal 2 tekens)" },
      { status: 400 },
    );
  }
  if (!email || !valideerEmail(email)) {
    return NextResponse.json(
      { error: "Geldig e-mailadres vereist" },
      { status: 400 },
    );
  }
  if (!bericht || bericht.trim().length < 5) {
    return NextResponse.json(
      { error: "Bericht is te kort (minimaal 5 tekens)" },
      { status: 400 },
    );
  }
  if (bericht.length > 5000) {
    return NextResponse.json(
      { error: "Bericht is te lang (maximaal 5000 tekens)" },
      { status: 400 },
    );
  }
  if (!avg) {
    return NextResponse.json(
      { error: "Akkoord met privacyverklaring vereist" },
      { status: 400 },
    );
  }

  const userAgent = req.headers.get("user-agent");

  try {
    await createContactMessage({ naam, email, bericht, ip, userAgent });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    const readOnly = /EROFS|read-only/i.test(m);
    return NextResponse.json(
      {
        error: readOnly
          ? "Contactformulier is tijdelijk niet beschikbaar. Probeer het later opnieuw."
          : "Kon bericht niet opslaan. Probeer het later opnieuw.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    bericht: "Bedankt voor je bericht — we lezen het zo snel mogelijk.",
  });
}
