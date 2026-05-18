import { NextResponse } from "next/server";
import {
  fetchWetsvoorstellenVoorCommissie,
  normalize,
} from "@/lib/tk-api";
import { MINISTERIES, getMinisterie } from "@/lib/ministeries";

export const revalidate = 86400;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const slug = url.searchParams.get("ministerie");

  try {
    if (slug) {
      const m = getMinisterie(slug);
      if (!m) {
        return NextResponse.json(
          { error: `Onbekend ministerie: ${slug}` },
          { status: 404 },
        );
      }
      const zaken = await fetchWetsvoorstellenVoorCommissie(m.commissie, 200);
      const items = zaken.map(normalize);
      return NextResponse.json(
        {
          ministerie: m.naam,
          slug: m.slug,
          opgehaaldOp: new Date().toISOString(),
          aantal: items.length,
          items,
        },
        { headers: cacheHeader(refresh) },
      );
    }

    // Geen slug: geef per ministerie de telling per fase.
    const resultaten = await Promise.all(
      MINISTERIES.map(async (m) => {
        try {
          const zaken = await fetchWetsvoorstellenVoorCommissie(
            m.commissie,
            300,
          );
          const items = zaken.map(normalize);
          return { ministerie: m, aantal: items.length, items };
        } catch {
          return { ministerie: m, aantal: 0, items: [] };
        }
      }),
    );

    return NextResponse.json(
      {
        opgehaaldOp: new Date().toISOString(),
        ministeries: resultaten.map((r) => ({
          slug: r.ministerie.slug,
          naam: r.ministerie.naam,
          afkorting: r.ministerie.afkorting,
          aantal: r.aantal,
          aantalLopend: r.items.filter((i) => !i.afgedaan).length,
        })),
      },
      { headers: cacheHeader(refresh) },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function cacheHeader(refresh: boolean): Record<string, string> {
  return {
    "Cache-Control": refresh
      ? "no-store"
      : "public, s-maxage=86400, stale-while-revalidate=43200",
  };
}
