import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchWetsvoorstel,
  normalize,
  FASE_LABEL,
  FASE_KLEUR,
} from "@/lib/tk-api";
import { getUitleg } from "@/lib/explanations";
import { getMinisterieByCommissie } from "@/lib/ministeries";
import { ProcesBalk } from "@/components/ProcesBalk";
import { getEkStatus } from "@/lib/ek-status";
import { SubscribeButton } from "@/components/SubscribeButton";

export const revalidate = 21600;

type Params = { params: Promise<{ id: string }> };

export default async function WetDetail({ params }: Params) {
  const { id } = await params;
  const zaak = await fetchWetsvoorstel(id);
  if (!zaak) notFound();

  const item = normalize(zaak);
  const uitleg = getUitleg(item.id);
  const ministerie = item.voortouwcommissie
    ? getMinisterieByCommissie(item.voortouwcommissie)
    : null;
  const ekStatus = getEkStatus(item.id);

  const activiteiten = (zaak.Activiteit ?? [])
    .filter((a) => a.Datum)
    .sort(
      (a, b) =>
        new Date(b.Datum as string).getTime() -
        new Date(a.Datum as string).getTime(),
    );

  const besluiten = (zaak.Besluit ?? []).sort(
    (a, b) =>
      new Date(b.GewijzigdOp ?? 0).getTime() -
      new Date(a.GewijzigdOp ?? 0).getTime(),
  );

  return (
    <article className="space-y-10">
      <div>
        {ministerie ? (
          <Link
            href={`/ministerie/${ministerie.slug}`}
            className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
          >
            ← terug naar {ministerie.korteNaam}
          </Link>
        ) : (
          <Link
            href="/"
            className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
          >
            ← terug naar overzicht
          </Link>
        )}
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
          <span className="font-mono">{item.nummer}</span>
          {item.dossierNummer && <span>· dossier {item.dossierNummer}</span>}
          {item.vergaderjaar && <span>· vergaderjaar {item.vergaderjaar}</span>}
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl leading-tight break-words">
          {item.titel}
        </h1>
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${FASE_KLEUR[item.fase]}`}
          >
            {FASE_LABEL[item.fase]}
          </span>
          {item.voortouwcommissie && (
            <span className="text-xs text-mute">
              Voortouw: {item.voortouwcommissie}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-md border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-serif text-lg">Waar bevindt het zich nu?</h2>
          <Link
            href="/proces"
            className="text-xs text-mute hover:text-ink underline"
          >
            hoe werkt het hele proces? →
          </Link>
        </div>
        <ProcesBalk fase={item.fase} />
        {ekStatus?.gevonden && ekStatus.ekUrl && (
          <div className="text-xs text-mute pt-2 border-t border-line">
            EK-fase: {ekStatus.label} ·{" "}
            <a
              href={ekStatus.ekUrl}
              target="_blank"
              rel="noopener"
              className="underline hover:text-ink"
            >
              bekijk op eerstekamer.nl ↗
            </a>
          </div>
        )}
      </section>

      {item.fase !== "verworpen" &&
        item.fase !== "ingetrokken" &&
        item.fase !== "wet" && (
          <section className="space-y-3">
            <SubscribeButton
              target="wet"
              wetId={item.id}
              titel={item.titel}
            />
          </section>
        )}

      {uitleg && (
        <section className="rounded-md border border-accent/40 bg-accent/5 dark:bg-accent/10 p-5 space-y-2">
          <div className="text-xs uppercase tracking-wide text-accent font-medium">
            Wat betekent dit voor jou?
          </div>
          <p className="text-base leading-relaxed">
            <span className="font-medium">{uitleg.watRegelt}</span>
          </p>
          <p className="text-sm leading-relaxed text-ink/80">
            {uitleg.raaktJou}
          </p>
          {uitleg.voorWie && uitleg.voorWie.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {uitleg.voorWie.map((v) => (
                <span
                  key={v}
                  className="text-xs bg-surface border border-line px-2 py-0.5 rounded-full text-mute"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
          <div className="text-[10px] text-mute pt-1">
            AI-gegenereerde samenvatting op basis van de officiële titel/onderwerp.
            Bekijk de tijdlijn en besluiten hieronder voor de feiten.
          </div>
        </section>
      )}

      {item.volgendeActiviteit && (
        <section className="rounded-md border border-line bg-surface p-5">
          <div className="text-xs uppercase tracking-wide text-mute mb-1">
            Eerstvolgende moment
          </div>
          <div className="font-medium">
            {item.volgendeActiviteit.soort ?? "Activiteit"} —{" "}
            {formatDate(item.volgendeActiviteit.datum)}
          </div>
          <div className="text-sm text-mute mt-1">
            {item.volgendeActiviteit.onderwerp}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-serif text-xl mb-3">Tijdlijn van activiteiten</h2>
        {activiteiten.length === 0 ? (
          <p className="text-sm text-mute">
            Nog geen activiteiten geregistreerd.
          </p>
        ) : (
          <ol className="border-l border-line ml-2 space-y-5">
            {activiteiten.map((a) => (
              <li key={a.Id} className="relative pl-5">
                <span className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-accent" />
                <div className="text-xs text-mute">
                  {formatDate(a.Datum)}
                  {a.Status ? ` · ${a.Status}` : ""}
                </div>
                <div className="font-medium leading-snug">
                  {a.Soort ?? "Activiteit"}
                </div>
                {a.Onderwerp && (
                  <div className="text-sm text-mute mt-0.5">{a.Onderwerp}</div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Besluiten en stemmingen</h2>
        {besluiten.length === 0 ? (
          <p className="text-sm text-mute">
            Nog geen besluiten genomen door de Tweede Kamer.
          </p>
        ) : (
          <ul className="space-y-4">
            {besluiten.map((b) => (
              <li
                key={b.Id}
                className="rounded-md border border-line bg-surface p-4"
              >
                <div className="text-xs text-mute mb-1">
                  {formatDate(b.GewijzigdOp)}
                  {b.Status ? ` · ${b.Status}` : ""}
                </div>
                <div className="font-medium">
                  {b.BesluitSoort ?? b.StemmingsSoort ?? "Besluit"}
                </div>
                {b.BesluitTekst && (
                  <div className="text-sm mt-1">{b.BesluitTekst}</div>
                )}
                {b.Stemming && b.Stemming.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-wide text-mute mb-2">
                      Stemming per fractie
                    </div>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-sm">
                      {b.Stemming.map((s) => (
                        <li
                          key={s.Id}
                          className="flex justify-between border-b border-line/60 py-1"
                        >
                          <span className="truncate">{s.ActorFractie}</span>
                          <span
                            className={
                              s.Soort === "Voor"
                                ? "text-emerald-700 dark:text-emerald-300 font-medium"
                                : s.Soort === "Tegen"
                                  ? "text-rose-700 dark:text-rose-300 font-medium"
                                  : "text-mute"
                            }
                          >
                            {s.Soort}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Volledig onderwerp</h2>
        <p className="text-sm leading-relaxed">{item.onderwerp}</p>
      </section>

      <section className="text-xs text-mute pt-6 border-t border-line">
        Bron-record:{" "}
        <a
          href={`https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0/Zaak(${item.id})`}
          className="underline hover:text-ink"
        >
          TK OData Zaak {item.nummer}
        </a>
      </section>
    </article>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
