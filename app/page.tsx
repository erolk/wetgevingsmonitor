import Link from "next/link";
import { MINISTERIES, type Ministerie } from "@/lib/ministeries";
import { fetchWetsvoorstellenVoorCommissie, normalize } from "@/lib/tk-api";
import type { WetVoorstel } from "@/lib/types";
import {
  fetchAgenda,
  keywords,
  bouwDebatUrl,
  type DebatDirectItem,
} from "@/lib/debat-direct";
import { UitklapLijst } from "@/components/UitklapLijst";

export const revalidate = 86400;

type Gathered = {
  ministerie: Ministerie;
  items: WetVoorstel[];
  totaal: number;
  lopend: number;
  volgendeDatum: string | null;
};

async function gatherMinisterie(m: Ministerie): Promise<Gathered> {
  try {
    const zaken = await fetchWetsvoorstellenVoorCommissie(m.commissie, 200);
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
      ministerie: m,
      items,
      totaal: items.length,
      lopend: lopend.length,
      volgendeDatum: datums[0] ?? null,
    };
  } catch {
    return {
      ministerie: m,
      items: [],
      totaal: 0,
      lopend: 0,
      volgendeDatum: null,
    };
  }
}

function isoWeekNummer(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

function weekRange(today: Date): { ma: Date; volgendeMa: Date } {
  const ma = new Date(today);
  ma.setHours(0, 0, 0, 0);
  const dow = ma.getDay() || 7;
  ma.setDate(ma.getDate() - (dow - 1));
  const volgendeMa = new Date(ma);
  volgendeMa.setDate(volgendeMa.getDate() + 7);
  return { ma, volgendeMa };
}

function isBetekenisvolleBehandeling(
  soort: string | null | undefined,
): boolean {
  if (!soort) return false;
  const s = soort.toLowerCase();
  if (
    s.includes("inbreng") ||
    s.includes("procedurevergadering") ||
    s.includes("emailprocedure") ||
    s.includes("regeling van werkzaamheden")
  ) {
    return false;
  }
  return [
    "plenair",
    "commissiedebat",
    "wetgevingsoverleg",
    "tweeminutendebat",
    "notaoverleg",
    "rondetafelgesprek",
    "hoorzitting",
    "stemming",
  ].some((v) => s.includes(v));
}

export default async function Home() {
  const gathered = await Promise.all(MINISTERIES.map(gatherMinisterie));
  const tellingMap = new Map(gathered.map((g) => [g.ministerie.slug, g]));

  const totaal = gathered.reduce((a, g) => a + g.totaal, 0);
  const lopendTotaal = gathered.reduce((a, g) => a + g.lopend, 0);
  const laatstBijgewerkt = new Date().toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Verzamel wetten met een betekenisvolle TK-behandeling deze week.
  const nu = new Date();
  const { ma, volgendeMa } = weekRange(nu);
  const wkNr = isoWeekNummer(nu);
  const dezeWeek = await matchDezeWeekAgenda(ma, volgendeMa, gathered);

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

      <DezeWeekStrip wkNr={wkNr} items={dezeWeek} />

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

const NL_DAGEN = ["zo", "ma", "di", "wo", "do", "vr", "za"];

function formatDagKort(iso: string): string {
  const d = new Date(iso);
  return `${NL_DAGEN[d.getDay()]} ${d.getDate()}`;
}

type AgendaEntry = {
  wet: WetVoorstel;
  ministerie: Ministerie;
  debat: DebatDirectItem;
};

async function matchDezeWeekAgenda(
  ma: Date,
  volgendeMa: Date,
  gathered: Gathered[],
): Promise<AgendaEntry[]> {
  // Verzamel datums van de week (Mon t/m Sun = 7 dagen)
  const dagen: string[] = [];
  for (
    let d = new Date(ma);
    d.getTime() < volgendeMa.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    dagen.push(d.toISOString().slice(0, 10));
  }

  // Haal alle debaten van die dagen op (parallel)
  const debatenPerDag = await Promise.all(dagen.map(fetchAgenda));
  const alleDebaten = debatenPerDag.flat();

  // Maak een lookup van lopende wetten met hun keyword-set
  const lopendItems = gathered.flatMap((g) =>
    g.items
      .filter(
        (i) =>
          !i.afgedaan && i.fase !== "verworpen" && i.fase !== "ingetrokken",
      )
      .map((i) => ({
        wet: i,
        ministerie: g.ministerie,
        kw: keywords(i.titel),
      })),
  );

  const entries: AgendaEntry[] = [];
  const gezienPaar = new Set<string>();
  for (const debat of alleDebaten) {
    if (!isBetekenisvolleBehandeling(debat.debateType)) continue;
    const haystack = `${debat.name} ${debat.slug ?? ""}`.toLowerCase();
    let best: { score: number; item: (typeof lopendItems)[number] } | null =
      null;
    for (const item of lopendItems) {
      if (item.kw.length === 0) continue;
      const score = item.kw.reduce(
        (acc, w) => acc + (haystack.includes(w) ? 1 : 0),
        0,
      );
      if (score >= 2 && (!best || score > best.score)) {
        best = { score, item };
      }
    }
    if (best) {
      const sleutel = `${best.item.wet.id}|${debat.id}`;
      if (gezienPaar.has(sleutel)) continue;
      gezienPaar.add(sleutel);
      entries.push({
        wet: best.item.wet,
        ministerie: best.item.ministerie,
        debat,
      });
    }
  }

  entries.sort(
    (a, b) =>
      new Date(a.debat.startsAt).getTime() -
      new Date(b.debat.startsAt).getTime(),
  );
  return entries;
}

function DezeWeekStrip({
  wkNr,
  items,
}: {
  wkNr: number;
  items: AgendaEntry[];
}) {
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-1.5 border-b border-line/60">
        <h2 className="font-medium text-xs text-ink">
          Deze week op de TK-agenda{" "}
          <span className="text-mute font-normal">— week {wkNr}</span>
        </h2>
        <span className="text-[11px] text-mute shrink-0">
          {items.length === 0
            ? "geen behandeling"
            : `${items.length} ${items.length === 1 ? "wet" : "wetten"}`}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-[11px] text-mute">
          Geen wetsvoorstellen op de Tweede Kamer-agenda deze week.
        </p>
      ) : (
        <ul className="divide-y divide-line/60 text-[11px]">
          <UitklapLijst
            initialCount={3}
            meerTemplate="Toon overige {aantal} debaten deze week ↓"
            minderLabel="Toon minder ↑"
          >
            {items.map(({ wet, ministerie, debat }, idx) => (
              <li key={`${wet.id}-${debat.id}-${idx}`}>
                <div className="grid grid-cols-[3rem_2.5rem_1fr_auto] sm:grid-cols-[3rem_2.5rem_7rem_1fr_auto] gap-x-3 items-baseline px-3 py-1 hover:bg-paper transition group">
                  <span className="font-mono text-mute shrink-0 tabular-nums">
                    {formatDagKort(debat.startsAt)}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-mute shrink-0">
                    {ministerie.afkorting}
                  </span>
                  <span className="hidden sm:block text-mute truncate">
                    {debat.debateType}
                  </span>
                  <Link
                    href={`/wet/${wet.id}`}
                    className="truncate text-ink hover:underline min-w-0"
                  >
                    {wet.titel}
                  </Link>
                  <a
                    href={bouwDebatUrl(debat)}
                    target="_blank"
                    rel="noopener"
                    aria-label="Bekijk debat op Debat Direct"
                    title="Bekijk debat op Debat Direct"
                    className="text-mute hover:text-accent shrink-0"
                  >
                    ▶
                  </a>
                </div>
              </li>
            ))}
          </UitklapLijst>
        </ul>
      )}
    </section>
  );
}
