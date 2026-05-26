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
  type MaandInstroom,
} from "@/lib/asielcijfers";
import type { StemUitslag } from "@/lib/stemming";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "EU-migratiepact — monitor | Wetgevingsmonitor",
  description:
    "Volg het EU-migratiepact: asielinstroom per week en maand, de Nederlandse uitvoeringswetgeving in de Tweede en Eerste Kamer met stemmingen per fractie, en de asielinstroom per nationaliteit. Alleen officiële, openbare cijfers.",
};

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
function StaafGrafiek({
  punten,
}: {
  punten: { label: string; sub?: string; waarde: number; mark?: boolean }[];
}) {
  const max = Math.max(1, ...punten.map((p) => p.waarde));
  return (
    <div className="flex items-end gap-[3px] h-32 sm:h-40">
      {punten.map((p, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end h-full group min-w-0"
          title={`${p.label}${p.sub ? ` (${p.sub})` : ""}: ${p.waarde.toLocaleString("nl-NL")}`}
        >
          <span className="text-[9px] text-mute mb-0.5 tabular-nums hidden sm:block">
            {p.waarde.toLocaleString("nl-NL")}
          </span>
          <div
            className={`w-full rounded-t-sm ${p.mark ? "bg-accent" : "bg-accent/35"} group-hover:bg-accent transition-colors`}
            style={{ height: `${Math.max(2, (p.waarde / max) * 100)}%` }}
          />
          <span className="text-[8px] text-mute mt-1 truncate w-full text-center">
            {p.label}
          </span>
        </div>
      ))}
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

export default async function MigratiepactPagina() {
  const [dossiers, maand, nationaliteiten] = await Promise.all([
    getPactDossiers(),
    getMaandInstroom(24),
    getNationaliteitenPerJaar(15),
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

  return (
    <div className="space-y-10">
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
