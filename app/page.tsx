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
import { isAfgerond } from "@/lib/fase-display";
import { getDict, tpl } from "@/lib/i18n";
import type { Dictionary, Locale } from "@/lib/i18n";

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
    // Lopend = nog niet afgerond (zie isAfgerond). Een naar de EK doorgestuurde
    // wet (Afgedaan=true, fase in_eerste_kamer) telt mee als lopend.
    const lopend = items.filter((i) => !isAfgerond(i.fase));
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
  const { dict, locale } = await getDict();
  const gathered = await Promise.all(MINISTERIES.map(gatherMinisterie));
  const tellingMap = new Map(gathered.map((g) => [g.ministerie.slug, g]));

  const totaal = gathered.reduce((a, g) => a + g.totaal, 0);
  const lopendTotaal = gathered.reduce((a, g) => a + g.lopend, 0);
  const laatstBijgewerkt = new Date().toLocaleString(
    locale === "en" ? "en-GB" : "nl-NL",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  // Verzamel wetten met een betekenisvolle TK-behandeling deze week.
  const nu = new Date();
  const { ma, volgendeMa } = weekRange(nu);
  const wkNr = isoWeekNummer(nu);
  const dezeWeek = await matchDezeWeekAgenda(ma, volgendeMa, gathered);

  const ministerieDict = dict.ministeries;

  return (
    <div className="space-y-14">
      <section>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight max-w-3xl">
          {dict.home.title}
        </h1>
        <p className="mt-4 max-w-2xl text-mute leading-relaxed">
          {dict.home.intro}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-medium">{lopendTotaal}</span>{" "}
          <span className="text-mute">
            {tpl(dict.home.statsRunning, { totaal })}
          </span>
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-mute">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
            <span className="relative rounded-full h-2 w-2 bg-accent" />
          </span>
          {tpl(dict.home.lastSync, { datum: laatstBijgewerkt })}
        </div>
      </section>

      <DezeWeekStrip
        wkNr={wkNr}
        items={dezeWeek}
        dict={dict}
        locale={locale}
      />

      <section>
        <h2 className="font-serif text-2xl mb-4">{dict.home.chooseMinistry}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...MINISTERIES]
            .map((m) => ({
              m,
              labels: ministerieDict[m.slug] ?? {
                naam: m.naam,
                korteNaam: m.korteNaam,
                beschrijving: m.beschrijving,
              },
            }))
            .sort((a, b) =>
              a.labels.naam.localeCompare(b.labels.naam, locale),
            )
            .map(({ m, labels }) => {
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
                      {labels.naam}
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-mute pt-1.5 shrink-0">
                      {m.afkorting}
                    </div>
                  </div>
                  <div className="text-xs text-mute mt-2 line-clamp-2">
                    {labels.beschrijving}
                  </div>
                  <div className="mt-3 pt-3 border-t border-line/60 flex items-baseline gap-4 text-sm">
                    <div>
                      <span className="font-medium text-base text-ink">
                        {t?.lopend ?? "—"}
                      </span>
                      <span className="text-mute ml-1">
                        {dict.home.tileRunning}
                      </span>
                    </div>
                    <div className="text-mute">
                      {tpl(dict.home.tileTotal, { n: t?.totaal ?? 0 })}
                    </div>
                  </div>
                  {heeftAgenda && (
                    <div className="mt-2 text-xs text-ink/80">
                      {tpl(dict.home.tileNext, {
                        datum: formatDate(t!.volgendeDatum!, locale),
                      })}
                    </div>
                  )}
                </Link>
              );
            })}
        </div>
      </section>

      <section className="text-sm text-mute">
        {dict.home.bottomDisclaimer}
      </section>
    </div>
  );
}

function formatDate(iso: string, locale: Locale = "nl"): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === "en" ? "en-GB" : "nl-NL",
      { day: "numeric", month: "short" },
    );
  } catch {
    return iso;
  }
}

const DAGEN: Record<Locale, string[]> = {
  nl: ["zo", "ma", "di", "wo", "do", "vr", "za"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

function formatDagKort(iso: string, locale: Locale = "nl"): string {
  const d = new Date(iso);
  return `${DAGEN[locale][d.getDay()]} ${d.getDate()}`;
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
      .filter((i) => !isAfgerond(i.fase))
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
  dict,
  locale,
}: {
  wkNr: number;
  items: AgendaEntry[];
  dict: Dictionary;
  locale: Locale;
}) {
  const countLabel =
    items.length === 0
      ? dict.home.weekStripNoBehandeling
      : tpl(
          items.length === 1
            ? dict.home.weekStripCountSingular
            : dict.home.weekStripCountPlural,
          { n: items.length },
        );
  return (
    <section className="rounded-md border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-1.5 border-b border-line/60">
        <h2 className="font-medium text-sm text-ink">
          {dict.home.weekStripTitle}{" "}
          <span className="text-mute font-normal">
            {tpl(dict.home.weekStripWeekLabel, { n: wkNr })}
          </span>
        </h2>
        <span className="text-xs text-mute shrink-0">{countLabel}</span>
      </div>
      {items.length === 0 ? (
        <p className="px-3 py-2 text-xs text-mute">
          {dict.home.weekStripEmpty}
        </p>
      ) : (
        <ul className="divide-y divide-line/60 text-xs">
          <UitklapLijst
            initialCount={3}
            meerTemplate={dict.home.weekStripShowMore}
            minderLabel={dict.home.weekStripShowLess}
          >
            {items.map(({ wet, ministerie, debat }, idx) => (
              <li key={`${wet.id}-${debat.id}-${idx}`}>
                <div className="grid grid-cols-[3rem_2.5rem_1fr_auto] sm:grid-cols-[3rem_2.5rem_7rem_1fr_auto] gap-x-3 items-baseline px-3 py-1 hover:bg-paper transition group">
                  <span className="font-mono text-mute shrink-0 tabular-nums">
                    {formatDagKort(debat.startsAt, locale)}
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
                    aria-label={dict.home.weekStripDebatDirectAria}
                    title={dict.home.weekStripDebatDirectAria}
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
