import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook om de Next.js cache van de belangrijkste pagina's leeg te gooien.
// Bedoeld om aangeroepen te worden door een GitHub Action (na een wekelijkse
// scrape, of dagelijks via een cron). Beveiligd met een geheim token.
//
// Gebruik:
//   curl "https://<domein>/api/revalidate?secret=<token>"
//   curl "https://<domein>/api/revalidate?secret=<token>&pad=/migratiepact"
//
// Standaard ververst hij de homepage + migratiepact + alle ministerie-pagina's
// + wet-detailpagina's + proces + zoeken. Een specifiek pad meegeven ververst
// alleen dat pad.

const STANDAARD_PADEN: { pad: string; type?: "page" | "layout" }[] = [
  { pad: "/" },
  { pad: "/migratiepact" },
  { pad: "/proces" },
  { pad: "/zoeken" },
  { pad: "/ministerie/[slug]", type: "page" },
  { pad: "/wet/[id]", type: "page" },
];

function secretKlopt(invoer: string | null): boolean {
  const verwacht = process.env.REVALIDATE_SECRET ?? "";
  if (!verwacht || !invoer) return false;
  const a = Buffer.from(invoer);
  const b = Buffer.from(verwacht);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secretKlopt(secret)) {
    return NextResponse.json({ ok: false, error: "ongeldig token" }, { status: 401 });
  }

  const pad = url.searchParams.get("pad");
  const vernieuwd: string[] = [];
  try {
    if (pad) {
      revalidatePath(pad);
      vernieuwd.push(pad);
    } else {
      for (const p of STANDAARD_PADEN) {
        revalidatePath(p.pad, p.type);
        vernieuwd.push(p.pad);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    vernieuwd,
    op: new Date().toISOString(),
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
