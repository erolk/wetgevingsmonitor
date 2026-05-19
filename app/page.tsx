import Link from "next/link";
import { MINISTERIES } from "@/lib/ministeries";
import { fetchWetsvoorstellenVoorCommissie, normalize } from "@/lib/tk-api";

export const revalidate = 86400;

type Telling = {
  slug: string;
  totaal: number;
  lopend: number;
  volgendeDatum: string | null;
};

async function tellen(commissie: string): Promise<Omit<Telling, "slug">> {
  try {
    const zaken = await fetchWetsvoorstellenVoorCommissie(commissie, 200);
    const items = zaken.map(normalize);
    const lopend = items.filter(
      (i) =>
        !i.afgedaan && i.fase !== "verworpen" && i.fase !== "ingetrokken",
    );
    const datums = items
      .map((i) => i.volgendeActiviteit?.datum)
      .filter((d): d is string => !!d && new Date(d).getTime() >= Date.now())
      .sort();
    return {
      totaal: items.length,
      lopend: lopend.length,
      volgendeDatum: datums[0] ?? null,
    };
  } catch {
    return { totaal: 0, lopend: 0, volgendeDatum: null };
  }
}

export default async function Home() {
  const tellingen = await Promise.all(
    MINISTERIES.map(async (m) => ({
      slug: m.slug,
      ...(await tellen(m.commissie)),
    })),
  );
  const tellingMap = new Map(tellingen.map((t) => [t.slug, t]));

  const totaal = tellingen.reduce((a, t) => a + t.totaal, 0);
  const lopendTotaal = tellingen.reduce((a, t) => a + t.lopend, 0);
  const laatstBijgewerkt = new Date().toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-14">
      <section>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight max-w-3xl">
          Welke wetten worden er momenteel gemaakt en behandeld?
        </h1>
        <p className="mt-4 max-w-2xl text-mute leading-relaxed">
          Per ministerie zie je live welke wetten in behandeling zijn, waar ze
          zich bevinden in het proces, en wanneer er weer over wordt gestemd of
          gedebatteerd. Direct uit de openbare data van de Tweede Kamer.
        </p>
        <p className="mt-3 text-sm">
          <span className="font-medium">{lopendTotaal}</span>{" "}
          <span className="text-mute">
            lopende wetsvoorstellen op dit moment, {totaal} totaal in
            behandeling of recent afgerond.
          </span>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-mute">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
            <span className="relative rounded-full h-2 w-2 bg-accent" />
          </span>
          Laatst gesynchroniseerd met TK-API op {laatstBijgewerkt} · ververst
          automatisch elke 24 uur (wet-detailpagina&apos;s elke 6 uur)
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-4">Kies een ministerie</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...MINISTERIES]
            .sort((a, b) => a.naam.localeCompare(b.naam, "nl"))
            .map((m) => {
            const t = tellingMap.get(m.slug);
            const heeftAgenda = t?.volgendeDatum;
            return (
              <Link
                key={m.slug}
                href={`/ministerie/${m.slug}`}
                className={`block rounded-lg border ${m.kleur} px-4 py-4 shadow-tile`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-serif text-base sm:text-lg leading-tight text-ink">
                    {m.naam}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-mute pt-1.5 shrink-0">
                    {m.afkorting}
                  </div>
                </div>
                <div className="text-xs text-mute mt-2 line-clamp-2">
                  {m.beschrijving}
                </div>
                <div className="mt-3 pt-3 border-t border-line/60 flex items-baseline gap-4 text-sm">
                  <div>
                    <span className="font-medium text-base text-ink">
                      {t?.lopend ?? "—"}
                    </span>
                    <span className="text-mute ml-1">lopend</span>
                  </div>
                  <div className="text-mute">{t?.totaal ?? 0} totaal</div>
                </div>
                {heeftAgenda && (
                  <div className="mt-2 text-xs text-ink/80">
                    eerstvolgend op {formatDate(t!.volgendeDatum!)}
                  </div>
                )}
              </Link>
            );
            })}
        </div>
      </section>

      <section className="text-sm text-mute">
        Brondata: Tweede Kamer Open Data (CC0). Burger-uitleg per wet wordt
        automatisch gegenereerd met behulp van AI op basis van de officiële
        titel en het onderwerp. Geen officiële site van de overheid.
      </section>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}
