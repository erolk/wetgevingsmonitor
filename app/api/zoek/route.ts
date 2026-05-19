import { NextResponse } from "next/server";
import { MINISTERIES } from "@/lib/ministeries";
import { fetchWetsvoorstellenVoorCommissie, normalize } from "@/lib/tk-api";
import { getUitleg } from "@/lib/explanations";
import type { ZoekItem } from "@/lib/zoek-types";

// Bouwt de zoek-index voor alle ministeries. Een keer per dag opnieuw.
// Output is een compact JSON dat de /zoeken-pagina volledig client-side
// kan doorzoeken (geen server-roundtrips bij typen).
export const revalidate = 86400;

export async function GET() {
  const lijsten = await Promise.all(
    MINISTERIES.map(async (m) => {
      try {
        const zaken = await fetchWetsvoorstellenVoorCommissie(m.commissie, 80);
        return zaken.map(normalize).map<ZoekItem>((it) => {
          const u = getUitleg(it.id);
          return {
            id: it.id,
            nummer: it.nummer,
            titel: it.titel,
            onderwerp: it.onderwerp,
            fase: it.fase,
            ministerie: {
              slug: m.slug,
              afkorting: m.afkorting,
              korteNaam: m.korteNaam,
            },
            gestartOp: it.gestartOp,
            afgedaan: it.afgedaan,
            uitlegTekst: u ? `${u.watRegelt} ${u.raaktJou}` : null,
            voorWie: u?.voorWie ?? null,
          };
        });
      } catch {
        return [];
      }
    }),
  );

  // Dedupe op id — een wet kan in theorie bij meerdere commissies horen
  const seen = new Map<string, ZoekItem>();
  for (const arr of lijsten) {
    for (const item of arr) {
      if (!seen.has(item.id)) seen.set(item.id, item);
    }
  }

  return NextResponse.json(
    {
      opgehaaldOp: new Date().toISOString(),
      aantal: seen.size,
      items: [...seen.values()],
    },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    },
  );
}
