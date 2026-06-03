import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getKabinet,
  alleKabinetten,
  bewindspersoonNamen,
  bewindspersoonViaNaam,
  type Kabinet,
  type Bewindspersoon,
} from "@/lib/kabinet";
import {
  fetchWetsvoorstellenByIndieners,
  normalize,
  FASE_KLEUR,
} from "@/lib/tk-api";
import { isAfgerond, FASE_LABEL } from "@/lib/fase-display";
import type { Fase, WetVoorstel, TkZaak } from "@/lib/types";
import { weergaveTitel } from "@/lib/wet-display";
import { getUitleg } from "@/lib/explanations";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return alleKabinetten().map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const k = getKabinet(slug);
  if (!k) return {};
  const titel = `${k.naam} — wetten en stand van zaken`;
  const omschr = `Welke wetten heeft ${k.korteNaam} ingediend sinds ${fmtDatum(k.startDatum)}? Aangenomen, in behandeling, en niet doorgekomen — uit officiële Tweede Kamer Open Data.`;
  const url = `${SITE_URL}/kabinet/${k.slug}`;
  return {
    title: titel,
    description: omschr,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "Wetgevingsmonitor",
      title: titel,
      description: omschr,
      locale: "nl_NL",
    },
  };
}

function fmtDatum(iso: string | null): string {
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

type WetRijData = {
  wet: WetVoorstel;
  indiener: string | null;
  bewindspersoon: Bewindspersoon | null;
};

function bouwRijen(zaken: TkZaak[], kabinet: Kabinet): WetRijData[] {
  return zaken.map((z) => {
    const wet = normalize(z);
    const indienerActor = (z.ZaakActor ?? []).find(
      (a) => a.Relatie === "Indiener",
    );
    const indiener = indienerActor?.ActorNaam ?? null;
    const bewindspersoon = indiener
      ? bewindspersoonViaNaam(kabinet, indiener)
      : null;
    return { wet, indiener, bewindspersoon };
  });
}

function splitWetten(rijen: WetRijData[]) {
  const isAangenomen = (f: Fase) => f === "aangenomen_ek" || f === "wet";
  const isVerworpen = (f: Fase) => f === "verworpen" || f === "ingetrokken";
  const aangenomen = rijen.filter((r) => isAangenomen(r.wet.fase));
  const verworpen = rijen.filter((r) => isVerworpen(r.wet.fase));
  const pijplijn = rijen.filter((r) => !isAfgerond(r.wet.fase));
  return { aangenomen, pijplijn, verworpen };
}

function Stat({
  label,
  value,
  toon,
}: {
  label: string;
  value: number;
  toon: "ok" | "mid" | "nok";
}) {
  const accent =
    toon === "ok"
      ? "text-emerald-700"
      : toon === "nok"
        ? "text-rose-700"
        : "text-accent";
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-4">
      <div className={`font-serif text-3xl ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-mute leading-snug">{label}</div>
    </div>
  );
}

function WetRij({ data }: { data: WetRijData }) {
  const { wet, bewindspersoon, indiener } = data;
  const uitleg = getUitleg(wet.id);
  return (
    <li className="py-4">
      <Link href={`/wet/${wet.id}`} className="block group">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
          <div className="min-w-0 sm:flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-mute mb-1">
              <span className="font-mono">{wet.nummer}</span>
              {wet.gestartOp && (
                <>
                  <span>·</span>
                  <span>ingediend {fmtDatum(wet.gestartOp)}</span>
                </>
              )}
              {(bewindspersoon || indiener) && (
                <>
                  <span>·</span>
                  <span>
                    {bewindspersoon
                      ? `${bewindspersoon.departement} (${bewindspersoon.partij})`
                      : indiener}
                  </span>
                </>
              )}
            </div>
            <div className="font-medium leading-snug group-hover:underline">
              {weergaveTitel(wet)}
            </div>
            {uitleg && (
              <p className="mt-1.5 text-sm text-ink/80 leading-relaxed">
                {uitleg.watRegelt}
              </p>
            )}
          </div>
          <span
            className={`self-start shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${FASE_KLEUR[wet.fase]}`}
          >
            {FASE_LABEL[wet.fase]}
          </span>
        </div>
      </Link>
    </li>
  );
}

function WetLijst({
  titel,
  hint,
  rijen,
  leegLabel,
}: {
  titel: string;
  hint: string;
  rijen: WetRijData[];
  leegLabel: string;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-serif text-2xl">
          {titel}{" "}
          <span className="text-mute font-normal text-lg">
            ({rijen.length})
          </span>
        </h2>
        <p className="text-sm text-mute">{hint}</p>
      </div>
      {rijen.length === 0 ? (
        <p className="text-sm text-mute italic">{leegLabel}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rijen.map((r) => (
            <WetRij key={r.wet.id} data={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function KabinetPagina({ params }: Params) {
  const { slug } = await params;
  const k = getKabinet(slug);
  if (!k) notFound();

  const namen = bewindspersoonNamen(k);
  const zaken = await fetchWetsvoorstellenByIndieners(namen, k.startDatum, 200);
  const rijen = bouwRijen(zaken, k);
  const { aangenomen, pijplijn, verworpen } = splitWetten(rijen);

  return (
    <div className="space-y-10">
      {/* Kop */}
      <section>
        <p className="text-xs font-mono uppercase tracking-wider text-accent">
          Monitor
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight mt-1">
          {k.naam}
        </h1>
        <p className="mt-3 text-mute leading-relaxed max-w-2xl">
          Beëdigd op{" "}
          <strong className="text-ink">{fmtDatum(k.startDatum)}</strong>.
          Minister-president: <strong className="text-ink">{k.ministerPresident}</strong>.
          Coalitie: {k.partijen.join(", ")}. Op deze pagina staan de wetten die
          dit kabinet zelf heeft ingediend sinds de beëdiging — uit officiële
          Tweede Kamer Open Data.
        </p>
      </section>

      {/* Cijfers */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat
          label="Aangenomen door beide Kamers"
          value={aangenomen.length}
          toon="ok"
        />
        <Stat label="In behandeling" value={pijplijn.length} toon="mid" />
        <Stat
          label="Verworpen of ingetrokken"
          value={verworpen.length}
          toon="nok"
        />
      </section>

      {/* Aangenomen */}
      <WetLijst
        titel="Aangenomen door beide Kamers"
        hint="Wetten die zowel de Tweede als de Eerste Kamer hebben aangenomen, of zijn gepubliceerd in het Staatsblad."
        rijen={aangenomen}
        leegLabel="Nog geen wetten van dit kabinet door beide Kamers aangenomen."
      />

      {/* Pijplijn */}
      <WetLijst
        titel="In behandeling"
        hint="Wetten van dit kabinet die nog in de Tweede of Eerste Kamer liggen."
        rijen={pijplijn}
        leegLabel="Geen wetten in behandeling."
      />

      {/* Verworpen / ingetrokken */}
      <WetLijst
        titel="Verworpen of ingetrokken"
        hint="Wetten die het kabinet wel indiende maar die niet door beide Kamers kwamen."
        rijen={verworpen}
        leegLabel="Geen wetten verworpen of ingetrokken."
      />

      {/* Verantwoording */}
      <section className="border-t border-line pt-6 text-xs text-mute space-y-2">
        <p>
          <strong className="text-ink">Verantwoording.</strong> Wij filteren op
          wetsvoorstellen (Soort &lsquo;Wetgeving&rsquo;) met een indieningsdatum
          vanaf <strong className="text-ink">{fmtDatum(k.startDatum)}</strong>{" "}
          waar de indiener één van de {k.bewindspersonen.length} bewindspersonen
          van {k.korteNaam} is. Initiatiefwetten (door Kamerleden) en wetten van
          eerdere kabinetten vallen daarmee buiten dit overzicht. De fase van
          elke wet komt uit Tweede Kamer Open Data; voor de Eerste Kamer
          gebruiken we de gescrapete EK-status. Geen waardeoordeel of
          interpretatie — alleen de feitelijke stand van zaken.
        </p>
        <p>Deze website is geen officiële website van de Rijksoverheid.</p>
      </section>
    </div>
  );
}
