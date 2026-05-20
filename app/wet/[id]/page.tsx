import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchWetsvoorstel, normalize, FASE_KLEUR } from "@/lib/tk-api";
import { isAfgerond } from "@/lib/fase-display";
import { getUitleg } from "@/lib/explanations";
import { getMinisterieByCommissie } from "@/lib/ministeries";
import { ProcesBalk } from "@/components/ProcesBalk";
import { getEkStatus } from "@/lib/ek-status";
import { SubscribeButton } from "@/components/SubscribeButton";
import {
  BesluitenLijst,
  type BesluitWeergave,
} from "@/components/BesluitenLijst";
import {
  aggregeerStemming,
  isStemmingBesluit,
  isProcedureelBesluit,
} from "@/lib/stemming";
import {
  findDebatVoorActiviteit,
  heeftMogelijkVideo,
  type DebatMatch,
} from "@/lib/debat-direct";
import { getWetContext } from "@/lib/wet-context";
import { getDict, tpl } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export const revalidate = 21600;

type Params = { params: Promise<{ id: string }> };

export default async function WetDetail({ params }: Params) {
  const { id } = await params;
  const zaak = await fetchWetsvoorstel(id);
  if (!zaak) notFound();

  const { dict, locale } = await getDict();
  const t = dict.wet;
  const item = normalize(zaak);
  const uitleg = getUitleg(item.id);
  const ministerie = item.voortouwcommissie
    ? getMinisterieByCommissie(item.voortouwcommissie)
    : null;
  const ministerieLabels = ministerie
    ? (dict.ministeries[ministerie.slug] ?? {
        naam: ministerie.naam,
        korteNaam: ministerie.korteNaam,
        beschrijving: ministerie.beschrijving,
      })
    : null;
  const ekStatus = getEkStatus(item.id);

  type ActiviteitType = NonNullable<typeof zaak.Activiteit>[number];
  const activiteitMap = new Map<string, ActiviteitType>();
  for (const a of zaak.Activiteit ?? []) {
    if (a.Id) activiteitMap.set(a.Id, a);
  }
  for (const b of zaak.Besluit ?? []) {
    const a = b.Agendapunt?.Activiteit;
    if (a?.Id && !activiteitMap.has(a.Id)) {
      activiteitMap.set(a.Id, a);
    }
  }
  const activiteiten = [...activiteitMap.values()]
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

  const nu = new Date().toISOString().slice(0, 10);
  const matchKandidaten = activiteiten.filter(
    (a) =>
      a.Datum &&
      a.Datum.slice(0, 10) <= nu &&
      heeftMogelijkVideo(a.Soort),
  );
  const matches = await Promise.all(
    matchKandidaten.map(async (a) => ({
      id: a.Id,
      match: await findDebatVoorActiviteit(
        a.Datum as string,
        a.Onderwerp,
        a.Soort,
      ),
    })),
  );
  const debatMatches = new Map<string, DebatMatch>(
    matches
      .filter((m): m is { id: string; match: DebatMatch } => m.match !== null)
      .map((m) => [m.id, m.match]),
  );

  // Stilstand-detectie: laatste activiteit > 6 maanden geleden EN niet
  // afgerond (zie isAfgerond — wet/verworpen/ingetrokken/aangenomen_ek).
  const STILSTAND_MAANDEN_DREMPEL = 6;
  const laatsteAct = activiteiten[0]; // gesorteerd nieuw→oud
  const laatsteActDatum = laatsteAct?.Datum
    ? new Date(laatsteAct.Datum)
    : null;
  const isAfgerondeFase = isAfgerond(item.fase);
  const maandenStilstand = laatsteActDatum
    ? Math.floor(
        (Date.now() - laatsteActDatum.getTime()) / (1000 * 60 * 60 * 24 * 30),
      )
    : null;
  const isStilstand =
    !isAfgerondeFase &&
    maandenStilstand !== null &&
    maandenStilstand >= STILSTAND_MAANDEN_DREMPEL;
  const handmatigeContext = getWetContext(item.id);
  const toonStilstandKader = isStilstand || handmatigeContext !== null;

  const stemmingBesluiten: BesluitWeergave[] = [];
  const procedureleBesluiten: BesluitWeergave[] = [];
  for (const b of besluiten) {
    const isStemming = isStemmingBesluit(b);
    const weergave: BesluitWeergave = {
      id: b.Id,
      besluitSoort: b.BesluitSoort,
      stemmingsSoort: b.StemmingsSoort,
      besluitTekst: b.BesluitTekst,
      status: b.Status,
      gewijzigdOp: b.GewijzigdOp,
      uitslag:
        isStemming && b.Stemming && b.Stemming.length > 0
          ? aggregeerStemming(b.Stemming, b.StemmingsSoort)
          : null,
    };
    if (isStemming) {
      stemmingBesluiten.push(weergave);
    } else if (isProcedureelBesluit(b)) {
      procedureleBesluiten.push(weergave);
    } else {
      procedureleBesluiten.push(weergave);
    }
  }

  return (
    <article className="space-y-10">
      <div>
        {ministerie && ministerieLabels ? (
          <Link
            href={`/ministerie/${ministerie.slug}`}
            className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
          >
            {tpl(t.backToMinistry, { naam: ministerieLabels.korteNaam })}
          </Link>
        ) : (
          <Link
            href="/"
            className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
          >
            {t.backToOverview}
          </Link>
        )}
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
          <span className="font-mono">{item.nummer}</span>
          {item.dossierNummer && (
            <span>
              · {t.fieldDossier} {item.dossierNummer}
            </span>
          )}
          {item.vergaderjaar && (
            <span>
              · {t.fieldVergaderjaar} {item.vergaderjaar}
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl leading-tight break-words">
          {item.titel}
        </h1>
        <div className="flex flex-wrap gap-2 items-center">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${FASE_KLEUR[item.fase]}`}
          >
            {dict.fase[item.fase]}
          </span>
          {item.voortouwcommissie && (
            <span className="text-xs text-mute">
              {t.fieldVoortouw} {item.voortouwcommissie}
            </span>
          )}
        </div>
      </header>

      <section className="rounded-md border border-line bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-serif text-lg">{t.sectionWhere}</h2>
          <Link
            href="/proces"
            className="text-xs text-mute hover:text-ink underline"
          >
            {t.howProcess}
          </Link>
        </div>
        <ProcesBalk fase={item.fase} />
        {ekStatus?.gevonden && ekStatus.ekUrl && (
          <div className="text-xs text-mute pt-2 border-t border-line">
            {t.ekPhasePrefix} {ekStatus.label} ·{" "}
            <a
              href={ekStatus.ekUrl}
              target="_blank"
              rel="noopener"
              className="underline hover:text-ink"
            >
              {t.ekView}
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
              dict={dict}
            />
          </section>
        )}

      {uitleg && (
        <section className="rounded-md border border-accent/40 bg-accent/5 dark:bg-accent/10 p-5 space-y-2">
          <div className="text-xs uppercase tracking-wide text-accent font-medium">
            {t.sectionWhatMeans}
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
          <div className="text-[10px] text-mute pt-1">{t.aiNote}</div>
        </section>
      )}

      {item.volgendeActiviteit && (
        <section className="rounded-md border border-line bg-surface p-5">
          <div className="text-xs uppercase tracking-wide text-mute mb-1">
            {t.nextMoment}
          </div>
          <div className="font-medium">
            {item.volgendeActiviteit.soort ?? t.activity} —{" "}
            {formatDate(item.volgendeActiviteit.datum, locale)}
          </div>
          <div className="text-sm text-mute mt-1">
            {item.volgendeActiviteit.onderwerp}
          </div>
        </section>
      )}

      {toonStilstandKader && (
        <section className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <span aria-hidden>⏸</span>
            <h2 className="font-serif text-lg">{t.stilstandTitle}</h2>
          </div>
          {isStilstand && laatsteActDatum && (
            <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
              {tpl(t.stilstandAutoNote, {
                datum: formatDate(laatsteActDatum.toISOString(), locale),
                maanden: maandenStilstand ?? 0,
              })}
            </p>
          )}
          {handmatigeContext && (
            <>
              {handmatigeContext.samenvatting && (
                <p className="text-sm leading-relaxed font-medium text-ink">
                  {handmatigeContext.samenvatting}
                </p>
              )}
              <p className="text-sm leading-relaxed text-ink/90">
                {handmatigeContext.waarom}
              </p>
              <div className="text-[10px] text-mute pt-1">
                {tpl(t.stilstandUpdated, {
                  datum: formatDate(
                    handmatigeContext.laatsteUpdate,
                    locale,
                  ),
                })}
              </div>
            </>
          )}
        </section>
      )}

      <section>
        <h2 className="font-serif text-xl mb-3">{t.timelineTitle}</h2>
        {activiteiten.length === 0 ? (
          <p className="text-sm text-mute">{t.timelineEmpty}</p>
        ) : (
          <ol className="border-l border-line ml-2 space-y-5">
            {activiteiten.map((a) => {
              const dbm = debatMatches.get(a.Id);
              return (
                <li key={a.Id} className="relative pl-5">
                  <span className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-accent" />
                  <div className="text-xs text-mute">
                    {formatDate(a.Datum, locale)}
                    {a.Status ? ` · ${a.Status}` : ""}
                  </div>
                  <div className="font-medium leading-snug">
                    {a.Soort ?? t.activity}
                  </div>
                  {a.Onderwerp && (
                    <div className="text-sm text-mute mt-0.5">
                      {a.Onderwerp}
                    </div>
                  )}
                  {dbm && (
                    <a
                      href={dbm.url}
                      target="_blank"
                      rel="noopener"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs rounded-md border border-line bg-surface hover:border-accent hover:text-accent transition px-2.5 py-1 text-mute"
                    >
                      <span aria-hidden>▶</span>
                      {dbm.zekerheid === "dag"
                        ? t.watchDay
                        : dbm.zekerheid === "waarschijnlijk"
                          ? tpl(t.watchLikely, { naam: dbm.naam })
                          : tpl(t.watchExact, { naam: dbm.naam })}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">{t.decisionsTitle}</h2>
        <BesluitenLijst
          stemmingen={stemmingBesluiten}
          procedureel={procedureleBesluiten}
          dict={dict}
          locale={locale}
        />
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">{t.onderwerpTitle}</h2>
        <p className="text-sm leading-relaxed">{item.onderwerp}</p>
      </section>

      <section className="text-xs text-mute pt-6 border-t border-line">
        {t.bronPrefix}{" "}
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

function formatDate(
  iso: string | null | undefined,
  locale: Locale,
): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(
      locale === "en" ? "en-GB" : "nl-NL",
      { day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return iso;
  }
}
