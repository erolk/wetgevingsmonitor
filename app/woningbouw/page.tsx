import type { Metadata } from "next";
import { getWoningbouw, maandNaam } from "@/lib/woningbouw";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

const TITEL = "Woningbouw per provincie sinds 2024";
const OMSCHR =
  "Hoeveel nieuwe woningen zijn er per provincie opgeleverd sinds 2024, op basis van officiële CBS-cijfers? Plus de context bij de Wet versterking regie volkshuisvesting en de 30%-sociale-huur-norm.";

export const metadata: Metadata = {
  title: `${TITEL} | Wetgevingsmonitor`,
  description: OMSCHR,
  alternates: { canonical: `${SITE_URL}/woningbouw` },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/woningbouw`,
    siteName: "Wetgevingsmonitor",
    title: TITEL,
    description: OMSCHR,
    locale: "nl_NL",
  },
};

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

export default async function WoningbouwPagina() {
  const data = await getWoningbouw(2024);

  return (
    <div className="space-y-10">
      {/* Kop */}
      <section>
        <p className="text-xs font-mono uppercase tracking-wider text-accent">
          Monitor
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight mt-1">
          {TITEL}
        </h1>
        <p className="mt-3 max-w-2xl text-mute leading-relaxed">
          Hoeveel nieuwe woningen zijn er per provincie opgeleverd sinds 2024,
          op basis van officiële CBS-cijfers? En wat zegt de Wet versterking
          regie volkshuisvesting over het verplichte percentage sociale huur?
          Alleen feitelijke open data — geen waardeoordeel.
        </p>
      </section>

      {/* Tabel */}
      <section>
        <h2 className="font-serif text-2xl mb-1">
          Opgeleverde nieuwbouwwoningen
        </h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          Aantal woningen toegevoegd aan de voorraad door nieuwbouw (exclusief
          verbouw of overige toevoegingen).
        </p>

        {!data ? (
          <p className="text-sm text-mute italic">
            CBS-cijfers zijn nu niet beschikbaar. Probeer het later opnieuw.
          </p>
        ) : (
          <>
            <div className="mb-3 rounded-md border border-line/70 bg-paper/40 px-3 py-2 text-xs text-mute leading-relaxed">
              <strong className="text-ink">Twee kolommen per jaar:</strong>{" "}
              <span className="text-ink">Nieuwbouw</span> = echt nieuw gebouwde
              woningen. <span className="text-ink">Toegevoegd</span> = totaal
              positief: nieuwbouw + verbouw + splitsen + functiewijziging (bv.
              kantoor wordt woning).
            </div>
            <div className="rounded-lg border border-line bg-surface overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/70">
                    <th
                      className="text-left font-medium text-mute px-3 py-2 align-bottom"
                      rowSpan={2}
                    >
                      Provincie
                    </th>
                    {data.jaren.map((k) => (
                      <th
                        key={k.jaar}
                        colSpan={2}
                        className="text-center font-medium text-mute px-3 pt-2 pb-1 border-l border-line/40"
                      >
                        {k.jaar}
                        {k.status === "partial" && k.laatsteMaand && (
                          <span className="block text-[10px] font-normal text-accent">
                            t/m {maandNaam(k.laatsteMaand)}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-line/70">
                    {data.jaren.flatMap((k) => [
                      <th
                        key={`${k.jaar}-nb`}
                        className="text-right font-normal text-[11px] text-mute px-3 pb-2 pt-0 border-l border-line/40"
                      >
                        Nieuwbouw
                      </th>,
                      <th
                        key={`${k.jaar}-tg`}
                        className="text-right font-normal text-[11px] text-mute px-3 pb-2 pt-0"
                      >
                        Toegevoegd
                      </th>,
                    ])}
                  </tr>
                </thead>
                <tbody>
                  {data.provincies.map((p) => (
                    <tr key={p.code} className="border-b border-line/40">
                      <td className="px-3 py-2 text-ink">{p.naam}</td>
                      {data.jaren.flatMap((k) => {
                        const cijfers = p.perJaar[k.jaar];
                        return [
                          <td
                            key={`${p.code}-${k.jaar}-nb`}
                            className="px-3 py-2 text-right tabular-nums text-ink border-l border-line/40"
                          >
                            {fmtGetal(cijfers.nieuwbouw)}
                          </td>,
                          <td
                            key={`${p.code}-${k.jaar}-tg`}
                            className="px-3 py-2 text-right tabular-nums text-mute"
                          >
                            {fmtGetal(cijfers.toegevoegd)}
                          </td>,
                        ];
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-paper/60">
                    <td className="px-3 py-2.5 font-medium text-ink">
                      Nederland (totaal)
                    </td>
                    {data.jaren.flatMap((k) => {
                      const tot = data.totalenPerJaar[k.jaar];
                      return [
                        <td
                          key={`tot-${k.jaar}-nb`}
                          className="px-3 py-2.5 text-right tabular-nums font-medium text-ink border-l border-line/40"
                        >
                          {fmtGetal(tot.nieuwbouw)}
                        </td>,
                        <td
                          key={`tot-${k.jaar}-tg`}
                          className="px-3 py-2.5 text-right tabular-nums font-medium text-mute"
                        >
                          {fmtGetal(tot.toegevoegd)}
                        </td>,
                      ];
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {data && (
          <p className="mt-2 text-[11px] text-mute">
            Bron:{" "}
            <a
              href="https://opendata.cbs.nl/ODataApi/OData/86098NED"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              CBS StatLine 86098NED (Levensloop van woningen)
            </a>{" "}
            · bijgewerkt {fmtDatum(data.bijgewerkt)} · jaren met &laquo;t/m
            maand&raquo; zijn voorlopige tussenstanden, geen vol jaar.
          </p>
        )}
      </section>

      {/* 30%-norm */}
      <section className="rounded-lg border border-line bg-surface px-4 py-4 sm:px-6 sm:py-5">
        <h2 className="font-serif text-xl mb-2">
          De 30%-sociale-huur-norm — wat staat er écht in de wet?
        </h2>
        <p className="text-sm text-ink/90 leading-relaxed">
          Het rijksbeleid bepaalt dat minstens{" "}
          <strong>30% van de nieuwbouw sociale huurwoningen</strong> moet zijn,
          en twee derde &laquo;betaalbaar&raquo; (sociale huur + middenhuur +
          middenkoop). Belangrijk om te weten:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink/85 list-disc pl-5">
          <li>
            Het doel geldt op{" "}
            <strong>landelijk, provinciaal en regionaal niveau</strong> — niet
            per gemeente, wijk of bouwproject. Een individuele provincie kan
            dus niet als &laquo;wel/niet voldaan&raquo; worden bestempeld op
            één jaar.
          </li>
          <li>
            De{" "}
            <strong>Wet versterking regie volkshuisvesting</strong>{" "}
            (Kamerstukdossier 36.512) treedt beoogd in werking op{" "}
            <strong>1 juli 2026</strong>. Tot die datum is het 30%-doel een
            beleidsstreven, geen wettelijke verplichting.
          </li>
          <li>
            Regio&apos;s krijgen na inwerkingtreding zes maanden om bindende
            afspraken te maken; tussentijdse rapportage per provincie volgt
            daarna pas.
          </li>
        </ul>
        <p className="mt-3 text-xs text-mute">
          Bronnen:{" "}
          <a
            href="https://www.rijksoverheid.nl/onderwerpen/volkshuisvesting/wet-versterking-regie-volkshuisvesting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Rijksoverheid
          </a>{" "}
          ·{" "}
          <a
            href="https://www.eerstekamer.nl/wetsvoorstel/36512_wet_versterking_regie"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Eerste Kamer 36.512
          </a>
        </p>
      </section>

      {/* Niet beschikbaar */}
      <section>
        <h2 className="font-serif text-2xl mb-1">
          Wat we (nog) niet kunnen tonen — en waarom
        </h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          Twee cijfers die misschien voor de hand liggen, maar die als
          jaarlijkse open data per provincie simpelweg niet bestaan. Eerlijk
          weglaten vinden we beter dan gokken.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-line bg-surface px-4 py-4">
            <h3 className="font-medium text-ink">
              % sociale huur in nieuwbouw per provincie per jaar
            </h3>
            <p className="mt-2 text-sm text-mute leading-relaxed">
              CBS publiceert woningvoorraad gesplitst op eigendom (koop /
              corporatie / overige huur), maar voor nieuwbouw alleen
              cohort-maatwerk in Excel — geen jaarlijkse provinciale OData. We
              wachten op de opvolger &laquo;Levensloop van woningen&raquo; en
              op de eerste rapportages onder de nieuwe wet.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-4 py-4">
            <h3 className="font-medium text-ink">
              Nieuwbouwkoop boven €400.000 per provincie per jaar
            </h3>
            <p className="mt-2 text-sm text-mute leading-relaxed">
              CBS publiceert prijsindexen en gemiddelden per provincie, maar
              géén aantallen per prijsklasse per provincie per jaar voor
              nieuwbouw. Een proxy zou de gemiddelde nieuwbouwprijs per
              provincie zijn — daarvoor is een aparte uitbreiding nodig.
            </p>
          </div>
        </div>
      </section>

      {/* Verantwoording */}
      <section className="border-t border-line pt-6 text-xs text-mute space-y-2">
        <p>
          <strong className="text-ink">Verantwoording.</strong> Cijfers komen
          uit CBS StatLine tabel 86098NED (&laquo;Levensloop van woningen en
          niet-woningen&raquo;), de opvolger van het in juni 2025 stopgezette
          81955NED. Jaarcijfers zijn definitief; lopende jaren tonen we als
          tussenstand met de aanduiding &laquo;t/m maand X&raquo;. CBS
          publiceert maandcijfers met ongeveer twee maanden vertraging — een
          gat tussen vandaag en de laatste maand is dus normaal en is geen
          fout in onze data. Geen interpretatie — alleen feitelijke aantallen.
        </p>
        <p>Deze website is geen officiële website van de Rijksoverheid.</p>
      </section>
    </div>
  );
}
