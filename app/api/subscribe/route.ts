import { NextResponse } from "next/server";
import { createSubscription } from "@/lib/subscriptions";
import { sendEmail, emailMode } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

function siteUrl(req: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function valideerEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function POST(req: Request) {
  // Max 5 aanmeldingen per IP per 10 minuten — tegen spam-floods.
  const ip = clientIp(req);
  const rl = rateLimit(`subscribe:${ip}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Te veel aanvragen. Probeer het later opnieuw." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: {
    email?: string;
    targetType?: "wet" | "ministerie" | "nieuwsbrief";
    wetId?: string;
    titel?: string;
    slug?: string;
    naam?: string;
    avg?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldig verzoek" }, { status: 400 });
  }

  const { email, targetType, wetId, titel, slug, naam, avg } = body;

  if (!email || !valideerEmail(email)) {
    return NextResponse.json(
      { error: "Geldig e-mailadres vereist" },
      { status: 400 },
    );
  }
  if (!avg) {
    return NextResponse.json(
      { error: "Akkoord met privacyverklaring vereist" },
      { status: 400 },
    );
  }

  let target;
  if (targetType === "wet") {
    if (!wetId || !titel) {
      return NextResponse.json(
        { error: "wetId en titel vereist" },
        { status: 400 },
      );
    }
    target = { type: "wet" as const, wetId, titel };
  } else if (targetType === "ministerie") {
    if (!slug || !naam) {
      return NextResponse.json(
        { error: "slug en naam vereist" },
        { status: 400 },
      );
    }
    target = { type: "ministerie" as const, slug, naam };
  } else if (targetType === "nieuwsbrief") {
    target = { type: "nieuwsbrief" as const };
  } else {
    return NextResponse.json(
      { error: "targetType moet 'wet', 'ministerie' of 'nieuwsbrief' zijn" },
      { status: 400 },
    );
  }

  let sub;
  try {
    sub = await createSubscription(email, target);
  } catch (e) {
    // Read-only filesystem (Vercel productie zonder DB): subscribe is nog niet
    // beschikbaar. Frontend toont dit als nette boodschap.
    const msg = e instanceof Error ? e.message : String(e);
    const isReadOnly = /EROFS|read-only/i.test(msg);
    return NextResponse.json(
      {
        error: isReadOnly
          ? "De abonneer-functie wordt binnenkort live gezet. Probeer het later opnieuw."
          : "Kon abonnement niet opslaan. Probeer het later opnieuw.",
      },
      { status: 503 },
    );
  }
  const base = siteUrl(req);
  const confirmUrl = `${base}/api/subscribe/confirm?token=${sub.confirmToken}`;
  const unsubscribeUrl = `${base}/api/subscribe/unsubscribe?token=${sub.unsubscribeToken}`;

  const targetOmschrijving =
    target.type === "wet"
      ? `het wetsvoorstel "${target.titel}"`
      : target.type === "ministerie"
        ? `alle wetten van het ministerie ${target.naam}`
        : "de wekelijkse nieuwsbrief";

  await sendEmail({
    to: email,
    subject:
      sub.status === "confirmed"
        ? `[Wetgevingsmonitor] Je bent al aangemeld voor ${targetOmschrijving}`
        : `Bevestig je aanmelding voor ${targetOmschrijving}`,
    text: `Hallo,

Je hebt je aangemeld om updates te ontvangen over ${targetOmschrijving}.

Bevestig je abonnement door op deze link te klikken:
${confirmUrl}

Zonder bevestiging wordt je e-mailadres binnen 7 dagen automatisch verwijderd.

Wil je je later uitschrijven? Dat kan altijd via deze link:
${unsubscribeUrl}

Met vriendelijke groet,
Wetgevingsmonitor`,
    html: `<p>Hallo,</p>
<p>Je hebt je aangemeld om updates te ontvangen over <strong>${targetOmschrijving}</strong>.</p>
<p><a href="${confirmUrl}" style="display:inline-block;padding:10px 16px;background:#2c5a6a;color:white;text-decoration:none;border-radius:4px">Bevestig mijn abonnement</a></p>
<p>Zonder bevestiging wordt je e-mailadres binnen 7 dagen automatisch verwijderd.</p>
<p style="color:#888;font-size:12px">Wil je je later uitschrijven? <a href="${unsubscribeUrl}">Uitschrijven</a></p>`,
  });

  return NextResponse.json({
    ok: true,
    status: sub.status,
    via: emailMode(),
    bericht:
      sub.status === "confirmed"
        ? "Je bent al geabonneerd. We hebben je een herinnering gestuurd."
        : "Check je inbox — we hebben een bevestigingsmail gestuurd.",
  });
}
