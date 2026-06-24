import Link from "next/link";
import type { Metadata } from "next";
import {
  getPactDossiers,
  dagenTotPactStart,
  PACT_START_ISO,
  type PactDossier,
} from "@/lib/migratiepact";
import { getWeekInstroom, type InstroomWeek } from "@/lib/asielinstroom";
import {
  getMaandInstroom,
  getNationaliteitenPerJaar,
  getJaarOpJaarSinds,
  type MaandInstroom,
  type JaarOpJaarVergelijking,
} from "@/lib/asielcijfers";
import type { StemUitslag } from "@/lib/stemming";
import { SITE_URL } from "@/lib/site";
import { NieuwsbriefForm } from "@/components/NieuwsbriefForm";

export const revalidate = 86400;

const PAGINA_URL = `${SITE_URL}/migratiepact`;
const OMSCHRIJVING =
  "Volg het EU-migratiepact: asielinstroom per week en maand, de Nederlandse uitvoeringswetgeving in de Tweede en Eerste Kamer met stemmingen per fractie, en de asielinstroom per nationaliteit. Alleen officiële, openbare cijfers.";

export const metadata: Metadata = {
  title: "EU-migratiepact volgen: asielinstroom, wetgeving & stemmingen",
  description: OMSCHRIJVING,
  keywords: [
    "EU-migratiepact",
    "asielpact",
    "asielinstroom",
    "asielwet",
    "Tweede Kamer stemming asiel",
    "Eerste Kamer asielwet",
    "migratie Nederland",
    "Uitvoeringswet asiel- en migratiepact",
  ],
  alternates: { canonical: PAGINA_URL },
  openGraph: {
    type: "website",
    url: PAGINA_URL,
    siteName: "Wetgevingsmonitor",
    title: "EU-migratiepact volgen: asielinstroom, wetgeving & stemmingen",
    description: OMSCHRIJVING,
    locale: "nl_NL",
  },
  twitter: {
    card: "summary_large_image",
    title: "EU-migratiepact — monitor",
    description: OMSCHRIJVING,
  },
};

// FAQ-structured data (kan rich snippets in Google opleveren). De antwoorden
// staan ook zichtbaar op de pagina; dat is wat Google wil zien.
const FAQ: { vraag: string; antwoord: string }[] = [
  {
    vraag: "Wanneer gaat het EU-migratiepact in?",
    antwoord:
      "De hoofdonderdelen van het EU-migratiepact zijn van toepassing vanaf 12 juni 2026. De verordeningen traden in werking op 11 juni 2024, met een overgangstermijn van twee jaar.",
  },
  {
    vraag: "Welke Nederlandse wet hoort bij het migratiepact?",
    antwoord:
      "Het hoofddossier is de Uitvoerings- en implementatiewet Asiel- en migratiepact (Kamerstukdossier 36871). Daarnaast loopt een nationaal asielpakket: de Wet invoering tweestatusstelsel (36703), de Asielnoodmaatregelenwet (36704) en een novelle (36855).",
  },
  {
    vraag: "Waar komen de cijfers vandaan?",
    antwoord:
      "Alle cijfers en stemuitslagen komen uit officiële, openbare bronnen: Tweede Kamer Open Data, de Eerste Kamer, CBS StatLine en de Rijksoverheid. Wekelijkse instroomcijfers zijn afgerond en indicatief; maandcijfers van het CBS zijn definitiever.",
  },
];

const PACT_START_LABEL = "12 juni 2026";

function fmtGetal(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("nl-NL");
}

function fmtDatum(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function deltaLabel(huidig: number, vorig: number | null): React.ReactNode {
  if (vorig == null) return null;
  const d = huidig - vorig;
  if (d === 0)
    return <span className="text-mute">gelijk t.o.v. vorige</span>;
  const omhoog = d > 0;
  return (
    <span className={omhoog ? "text-rose-700" : "text-emerald-700"}>
      {omhoog ? "▲" : "▼"} {Math.abs(d).toLocaleString("nl-NL")}{" "}
      {omhoog ? "meer" : "minder"} t.o.v. vorige
    </span>
  );
}

// Eenvoudige verticale staafgrafiek (geen library). `mark` kleurt staven die
// in/na de pact-periode vallen met de accentkleur.
// Mini-staafgrafiek zonder library. In plaats van een getal boven elke (smalle)
// staaf — wat bij duizendtallen over elkaar valt — gebruiken we een y-as met
// referentiewaarden + stippellijnen, en tonen we de exacte waarde in een
// zwevende tooltip bij hover (die mag overlappen, want pointer-events-none).
function StaafGrafiek({
  punten,
}: {
  punten: { label: string; sub?: string; waarde: number; mark?: boolean }[];
}) {
  const max = Math.max(1, ...punten.map((p) => p.waarde));
  const n = punten.length;
  const labelStap = Math.max(1, Math.ceil(n / 8)); // ~8 x-labels, rest leeg
  const niveaus = [1, 0.5, 0]; // y-as: max, helft, nul

  return (
    <div>
      <div className="relative h-36 sm:h-44">
        {/* y-as: stippellijnen met referentiewaarden */}
        {niveaus.map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 flex items-center"
            style={{ bottom: `${f * 100}%`, transform: "translateY(50%)" }}
          >
            <span className="w-7 shrink-0 pr-1 text-right text-[9px] tabular-nums leading-none text-mute">
              {Math.round(max * f).toLocaleString("nl-NL")}
            </span>
            <span className="flex-1 border-t border-dashed border-line/70" />
          </div>
        ))}

        {/* staven (boven de gridlijnen, met linker-marge voor de y-as) */}
        <div className="absolute inset-y-0 right-0 left-7 flex items-end gap-[3px]">
          {punten.map((p, i) => (
            <div
              key={i}
              className="group relative flex h-full min-w-0 flex-1 items-end"
              title={`${p.sub ?? p.label}: ${p.waarde.toLocaleString("nl-NL")}`}
            >
              <div
                className={`relative w-full rounded-t-sm ${p.mark ? "bg-accent" : "bg-accent/40"} group-hover:bg-accent transition-colors`}
                style={{ height: `${Math.max(3, (p.waarde / max) * 100)}%` }}
              >
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-paper shadow-md group-hover:block">
                  {p.sub ?? p.label}: {p.waarde.toLocaleString("nl-NL")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* x-as: uitgedunde labels, uitgelijnd met de staven */}
      <div className="mt-1.5 flex gap-[3px]">
        <span className="w-7 shrink-0" />
        {punten.map((p, i) => (
          <span
            key={i}
            className="min-w-0 flex-1 truncate text-center text-[8px] tabular-nums text-mute"
          >
            {i % labelStap === 0 || i === n - 1 ? p.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function splitFracties(uitslag: StemUitslag) {
  const voor = uitslag.perFractie
    .filter((f) => f.voor > f.tegen)
    .map((f) => f.fractie);
  const tegen = uitslag.perFractie
    .filter((f) => f.tegen > f.voor)
    .map((f) => f.fractie);
  const anders = uitslag.perFractie
    .filter((f) => f.voor === f.tegen)
    .map((f) => f.fractie);
  return { voor, tegen, anders };
}

function StemBalk({ uitslag }: { uitslag: StemUitslag }) {
  const totaal = Math.max(1, uitslag.voor + uitslag.tegen + uitslag.onthouden);
  const pct = (n: number) => `${(n / totaal) * 100}%`;
  const { voor, tegen, anders } = splitFracties(uitslag);
  return (
    <div className="mt-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-line">
        <div className="bg-emerald-500" style={{ width: pct(uitslag.voor) }} />
        <div className="bg-rose-500" style={{ width: pct(uitslag.tegen) }} />
        <div
          className="bg-zinc-400"
          style={{ width: pct(uitslag.onthouden) }}
        />
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
        <span className="text-emerald-700 font-medium">
          Voor {uitslag.voor}
        </span>
        <span className="text-rose-700 font-medium">Tegen {uitslag.tegen}</span>
        {uitslag.onthouden > 0 && (
          <span className="text-mute">Onthouden {uitslag.onthouden}</span>
        )}
        <span className="text-mute">
          {uitslag.isHoofdelijk ? "hoofdelijke stemming" : "stemming per fractie"}
        </span>
      </div>
      <div className="mt-2 space-y-1 text-xs">
        {voor.length > 0 && (
          <p>
            <span className="text-emerald-700 font-medium">Voor:</span>{" "}
            <span className="text-ink">{voor.join(", ")}</span>
          </p>
        )}
        {tegen.length > 0 && (
          <p>
            <span className="text-rose-700 font-medium">Tegen:</span>{" "}
            <span className="text-ink">{tegen.join(", ")}</span>
          </p>
        )}
        {anders.length > 0 && (
          <p className="text-mute">
            Overig/onbeslist: {anders.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function tkUitkomst(besluitSoort: string | null): {
  label: string;
  ok: boolean | null;
} {
  if (!besluitSoort) return { label: "nog niet gestemd", ok: null };
  if (/aangenomen/i.test(besluitSoort)) return { label: "aangenomen", ok: true };
  if (/verworpen/i.test(besluitSoort)) return { label: "verworpen", ok: false };
  return { label: besluitSoort, ok: null };
}

function ekUitkomst(d: PactDossier): { label: string; toon: "ok" | "nok" | "mid" } {
  switch (d.fase) {
    case "aangenomen_ek":
    case "wet":
      return { label: d.ekLabel ?? "aangenomen", toon: "ok" };
    case "verworpen":
      return { label: "verworpen", toon: "nok" };
    case "ingetrokken":
      return { label: "ingetrokken", toon: "nok" };
    case "in_eerste_kamer":
      return { label: d.ekLabel ?? "in behandeling", toon: "mid" };
    default:
      return { label: "nog niet in de Eerste Kamer", toon: "mid" };
  }
}

function Chip({
  children,
  toon,
}: {
  children: React.ReactNode;
  toon: "ok" | "nok" | "mid";
}) {
  const kleur =
    toon === "ok"
      ? "bg-emerald-100 text-emerald-900"
      : toon === "nok"
        ? "bg-rose-100 text-rose-900"
        : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${kleur}`}
    >
      {children}
    </span>
  );
}

function DossierKaart({ d }: { d: PactDossier }) {
  const tk = tkUitkomst(d.tkBesluitSoort);
  const ek = ekUitkomst(d);
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-base sm:text-lg text-ink leading-tight">
            {d.korteNaam}
          </h3>
          <p className="text-xs text-mute mt-0.5">
            Dossier {d.nummer} · {d.titel}
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-mute shrink-0 pt-1">
          {d.rol === "Uitvoeringswet pact" ? "PACT" : "context"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tweede Kamer */}
        <div className="rounded-md border border-line/70 bg-paper px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink">Tweede Kamer</span>
            {tk.ok !== null ? (
              <Chip toon={tk.ok ? "ok" : "nok"}>{tk.label}</Chip>
            ) : (
              <span className="text-xs text-mute">{tk.label}</span>
            )}
          </div>
          {d.tkStemming ? (
            <StemBalk uitslag={d.tkStemming} />
          ) : (
            <p className="mt-2 text-xs text-mute">
              Nog geen eindstemming in de Tweede Kamer.
            </p>
          )}
          {d.tkDatum && (
            <p className="mt-2 text-[11px] text-mute">
              Stemming: {fmtDatum(d.tkDatum)}
            </p>
          )}
        </div>

        {/* Eerste Kamer */}
        <div className="rounded-md border border-line/70 bg-paper px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink">Eerste Kamer</span>
            <Chip toon={ek.toon}>{ek.label}</Chip>
          </div>
          <p className="mt-2 text-xs text-mute">
            Uitkomst per Kamer. Stemmen per partij in de Eerste Kamer staan
            (nog) niet in open data; daarom tonen we hier de uitkomst.
          </p>
          {d.ekUrl && (
            <a
              href={d.ekUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-[11px] text-accent hover:underline"
            >
              Bron: eerstekamer.nl →
            </a>
          )}
        </div>
      </div>

      {d.zaakId && (
        <Link
          href={`/wet/${d.zaakId}`}
          className="mt-3 inline-block text-xs text-accent hover:underline"
        >
          Volledige tijdlijn en stemmingen →
        </Link>
      )}
    </div>
  );
}

function weekLabel(w: InstroomWeek): string {
  return `w${w.week}`;
}

function PactEffectTegel({ data }: { data: JaarOpJaarVergelijking }) {
  const isDaling = data.verschilProcent < 0;
  const isStijging = data.verschilProcent > 0;
  const kleur = isDaling
    ? "text-emerald-700"
    : isStijging
      ? "text-rose-700"
      : "text-mute";
  const pijl = isDaling ? "↓" : isStijging ? "↑" : "→";
  const omschrijving = isDaling
    ? "minder asielaanvragen dan dezelfde periode in 2025"
    : isStijging
      ? "meer asielaanvragen dan dezelfde periode in 2025"
      : "gelijk aan dezelfde periode in 2025";

  const eersteMaandLabel =
    data.maanden.find((m) => m.nu != null)?.label ?? data.startMaand;
  const laatsteMaandLabel =
    [...data.maanden].reverse().find((m) => m.nu != null)?.label ??
    eersteMaandLabel;

  return (
    <section className="rounded-lg border border-line bg-surface px-5 py-6 sm:px-8 sm:py-8">
      <p className="text-xs font-mono uppercase tracking-wider text-mute">
        Sinds pact-start (12 juni 2026) — t/m {laatsteMaandLabel}
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span
          className={`font-serif text-5xl sm:text-6xl leading-none ${kleur}`}
        >
          {pijl} {Math.abs(data.verschilProcent).toFixed(1)}%
        </span>
        <span className="text-ink text-sm sm:text-base max-w-md">
          {omschrijving}
        </span>
      </div>
      <p className="mt-3 text-sm text-mute">
        {data.totaalNu.toLocaleString("nl-NL")} aanvragen sinds{" "}
        {eersteMaandLabel} · {data.totaalVorig.toLocaleString("nl-NL")} in
        dezelfde periode een jaar eerder · verschil{" "}
        {data.verschilAbsoluut >= 0 ? "+" : ""}
        {data.verschilAbsoluut.toLocaleString("nl-NL")}.
      </p>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-sm text-accent hover:underline list-none flex items-center gap-1.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            aria-hidden="true"
            className="transition-transform group-open:rotate-180"
          >
            <path
              d="M2 4.5l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Hoe lees ik dit cijfer? Welke vergelijking is gebruikt?
        </summary>
        <div className="mt-3 text-xs text-mute leading-relaxed space-y-2 max-w-2xl">
          <p>
            <strong className="text-ink">Wat staat hier?</strong> Het aantal
            asielaanvragen vanaf {eersteMaandLabel} (de eerste volle maand
            ná de pact-startdatum) opgeteld, vergeleken met dezelfde
            maanden vorig jaar.
          </p>
          <p>
            <strong className="text-ink">Waarom jaar-op-jaar?</strong>{" "}
            Asielinstroom is sterk seizoensgebonden — zomer is altijd
            hoger dan voorjaar. Door dezelfde maanden te vergelijken
            (juli&apos;26 vs juli&apos;25 enzovoort) valt dat seizoenseffect
            weg en zie je echt de verandering ten opzichte van het
            voorgaande jaar. Vergelijken met een maandgemiddelde of een
            andere maand binnen hetzelfde jaar geeft een misleidend
            beeld.
          </p>
          <p>
            <strong className="text-ink">Belangrijk:</strong> Een daling
            betekent <em>niet</em> dat het pact &ldquo;werkt&rdquo;; een
            stijging niet dat het mislukt. Andere factoren spelen mee —
            conflicten elders (Oekraïne, Syrië, Soedan), grensbeleid van
            buurlanden, economische situatie in herkomstlanden. Dit
            cijfer toont <em>wat er gebeurt</em>, niet <em>waarom</em>.
          </p>
          <p>
            <strong className="text-ink">Bron:</strong>{" "}
            <a
              href="https://www.cbs.nl/nl-nl/cijfers/detail/83102NED"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              CBS StatLine 83102NED
            </a>{" "}
            (maandelijkse, definitieve cijfers; ~2 maanden vertraging).
          </p>
        </div>
      </details>
    </section>
  );
}

// Eerste volle kalendermaand na de pact-startdatum. Het pact gaat in op
// 12 juni 2026, dus juli 2026 is de eerste maand die we volledig kunnen
// vergelijken met het jaar ervoor.
const PACT_EFFECT_VANAF_MAAND = "2026-07";

export default async function MigratiepactPagina() {
  const [dossiers, maand, nationaliteiten, jaarOpJaar] = await Promise.all([
    getPactDossiers(),
    getMaandInstroom(24),
    getNationaliteitenPerJaar(15),
    getJaarOpJaarSinds(PACT_EFFECT_VANAF_MAAND),
  ]);
  const week = getWeekInstroom();
  const dagen = dagenTotPactStart();

  const pactDossier = dossiers.find((d) => d.rol === "Uitvoeringswet pact");
  const contextDossiers = dossiers.filter(
    (d) => d.rol === "Nationaal asielpakket",
  );

  // Week-trend
  const weken = week?.weken ?? [];
  const laatsteWeek = weken[weken.length - 1] ?? null;
  const vorigeWeek = weken[weken.length - 2] ?? null;

  // Maand-trend
  const maanden = maand?.maanden ?? [];
  const laatsteMaand = maanden[maanden.length - 1] ?? null;
  const vorigeMaand = maanden[maanden.length - 2] ?? null;
  const pactMaandStart = PACT_START_ISO.slice(0, 7); // "2026-06"

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.vraag,
      acceptedAnswer: { "@type": "Answer", text: f.antwoord },
    })),
  };

  return (
    <div className="space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Kop */}
      <section>
        <p className="text-xs font-mono uppercase tracking-wider text-accent">
          Monitor
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight mt-1">
          EU-migratiepact
        </h1>
        <p className="mt-3 max-w-2xl text-mute leading-relaxed">
          Het EU-migratiepact (Pact on Migration and Asylum) is van toepassing
          vanaf <strong className="text-ink">{PACT_START_LABEL}</strong>. Op deze
          pagina volgen we de asielinstroom, de Nederlandse uitvoeringswetgeving
          met de stemmingen in de Tweede en Eerste Kamer, en de instroom per
          nationaliteit — uitsluitend op basis van officiële, openbare cijfers.
        </p>
        {dagen > 0 ? (
          <p className="mt-3 inline-block rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900">
            Het pact gaat over <strong>{dagen} dagen</strong> in
            ({PACT_START_LABEL}). Vanaf dat moment kun je hier het effect op de
            instroom volgen.
          </p>
        ) : (
          <p className="mt-3 inline-block rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900">
            Het pact is sinds {PACT_START_LABEL} van toepassing.
          </p>
        )}
      </section>

      {/* Pact-effect tegel: jaar-op-jaar vergelijking sinds de eerste volle
          maand na pact-start. Toont zich pas zodra CBS data heeft voor die
          maand (~2 maanden na de feitelijke maand). */}
      {jaarOpJaar && <PactEffectTegel data={jaarOpJaar} />}

      {/* Nieuwsbrief-CTA */}
      <section className="rounded-lg border border-accent/40 bg-accent/5 px-4 py-4 sm:px-6 sm:py-5">
        <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="max-w-md">
            <h2 className="font-serif text-lg text-ink">
              Niets missen rond het migratiepact?
            </h2>
            <p className="mt-1 text-sm text-mute">
              Eén mail per week met de belangrijkste behandelde wetten — gratis
              en zonder reclame.
            </p>
          </div>
          <div className="mt-3 sm:mt-0 sm:w-80 shrink-0">
            <NieuwsbriefForm compact />
          </div>
        </div>
      </section>

      {/* Asielinstroom */}
      <section>
        <h2 className="font-serif text-2xl mb-1">Asielinstroom</h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          Per week (indicatief, afgeronde cijfers van de Rijksoverheid) en per
          maand (CBS, definitiever). Staven vanaf {PACT_START_LABEL} zijn
          gemarkeerd zodra het pact loopt.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Week */}
          <div className="rounded-lg border border-line bg-surface px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-medium text-ink">Per week</h3>
              {laatsteWeek && (
                <span className="text-xs text-mute">
                  week {laatsteWeek.week}: {fmtGetal(laatsteWeek.aantal)}
                </span>
              )}
            </div>
            {weken.length > 0 ? (
              <>
                <div className="mt-3">
                  <StaafGrafiek
                    punten={weken.map((w) => ({
                      label: weekLabel(w),
                      waarde: w.aantal,
                      mark: w.datum >= PACT_START_ISO,
                    }))}
                  />
                </div>
                {laatsteWeek && (
                  <p className="mt-2 text-xs">
                    {deltaLabel(laatsteWeek.aantal, vorigeWeek?.aantal ?? null)}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-mute">
                  Bron:{" "}
                  <a
                    href={week?.bron}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    Rijksoverheid, asielinstroom per week
                  </a>{" "}
                  · bijgewerkt {fmtDatum(week?.bijgewerkt ?? null)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-mute">
                Wekelijkse cijfers nog niet beschikbaar.
              </p>
            )}
          </div>

          {/* Maand */}
          <div className="rounded-lg border border-line bg-surface px-4 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-medium text-ink">Per maand</h3>
              {laatsteMaand && (
                <span className="text-xs text-mute">
                  {laatsteMaand.label}: {fmtGetal(laatsteMaand.totaal)}
                </span>
              )}
            </div>
            {maanden.length > 0 ? (
              <>
                <div className="mt-3">
                  <StaafGrafiek
                    punten={maanden.map((m: MaandInstroom) => ({
                      label: m.label.split(" ")[0],
                      sub: m.label,
                      waarde: m.totaal ?? 0,
                      mark: m.iso >= pactMaandStart,
                    }))}
                  />
                </div>
                {laatsteMaand && (
                  <p className="mt-2 text-xs">
                    {deltaLabel(
                      laatsteMaand.totaal ?? 0,
                      vorigeMaand?.totaal ?? null,
                    )}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-mute">
                  Bron:{" "}
                  <a
                    href="https://www.cbs.nl/nl-nl/cijfers/detail/83102NED"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    CBS StatLine 83102NED
                  </a>{" "}
                  (totaal asielverzoeken)
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-mute">
                Maandcijfers tijdelijk niet beschikbaar.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Wetgeving */}
      <section>
        <h2 className="font-serif text-2xl mb-1">
          Wetgeving & stemmingen
        </h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          De Nederlandse uitvoeringswet van het pact en het bijbehorende
          asielpakket: waar het ligt in het proces en wie er voor en tegen
          stemde.
        </p>

        {pactDossier && (
          <div className="mb-4">
            <DossierKaart d={pactDossier} />
          </div>
        )}

        {contextDossiers.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-mute mb-2">
              Nationaal asielpakket (context)
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {contextDossiers.map((d) => (
                <DossierKaart key={d.nummer} d={d} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Nationaliteiten */}
      <section>
        <h2 className="font-serif text-2xl mb-1">
          Asielinstroom per nationaliteit
        </h2>
        {nationaliteiten ? (
          <>
            <p className="text-sm text-mute mb-4">
              Eerste asielverzoeken in {nationaliteiten.jaar}, top{" "}
              {nationaliteiten.rijen.length}.
            </p>
            <div className="rounded-lg border border-line bg-surface px-4 py-3">
              <ul className="space-y-1.5">
                {(() => {
                  const max = Math.max(
                    1,
                    ...nationaliteiten.rijen.map((r) => r.eerste ?? 0),
                  );
                  return nationaliteiten.rijen.map((r) => (
                    <li
                      key={r.nationaliteit}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-28 shrink-0 truncate text-ink">
                        {r.nationaliteit}
                      </span>
                      <span className="flex-1 h-4 rounded-sm bg-line/50 overflow-hidden">
                        <span
                          className="block h-full bg-accent/55"
                          style={{
                            width: `${((r.eerste ?? 0) / max) * 100}%`,
                          }}
                        />
                      </span>
                      <span className="w-14 shrink-0 text-right tabular-nums text-mute">
                        {fmtGetal(r.eerste)}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
            <p className="mt-2 text-[11px] text-mute">
              Bron:{" "}
              <a
                href="https://www.cbs.nl/nl-nl/cijfers/detail/83102NED"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                CBS StatLine 83102NED
              </a>{" "}
              · eerste asielverzoeken naar nationaliteit
            </p>
          </>
        ) : (
          <p className="text-sm text-mute">
            Cijfers per nationaliteit tijdelijk niet beschikbaar.
          </p>
        )}
      </section>

      {/* Veelgestelde vragen */}
      <section>
        <h2 className="font-serif text-2xl mb-3">Veelgestelde vragen</h2>
        <dl className="space-y-3">
          {FAQ.map((f) => (
            <div
              key={f.vraag}
              className="rounded-lg border border-line bg-surface px-4 py-3"
            >
              <dt className="font-medium text-ink">{f.vraag}</dt>
              <dd className="mt-1 text-sm text-mute leading-relaxed">
                {f.antwoord}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Verantwoording */}
      <section className="border-t border-line pt-6 text-xs text-mute space-y-2">
        <p>
          <strong className="text-ink">Verantwoording.</strong> Alle cijfers en
          stemuitslagen komen uit officiële, openbare bronnen: Tweede Kamer Open
          Data, Eerste Kamer (eerstekamer.nl), CBS StatLine en de Rijksoverheid.
          Wekelijkse instroomcijfers zijn afgerond op honderdtallen en
          indicatief; maandcijfers van het CBS zijn definitiever. Deze pagina
          interpreteert niet en neemt geen standpunt in.
        </p>
        <p>
          Deze website is geen officiële website van de Rijksoverheid.
        </p>
      </section>
    </div>
  );
}
