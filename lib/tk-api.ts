import type {
  TkZaak,
  TkActiviteit,
  TkBesluit,
  WetVoorstel,
  Fase,
  NormActiviteit,
  NormBesluit,
} from "./types";
import { getEkStatus } from "./ek-status";

const BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";

type OData<T> = { value: T[]; "@odata.nextLink"?: string };

// OData filters bevatten `/`, `(`, `)`, `:` die niet ge-encodeerd mogen worden.
// URLSearchParams (vervangt spaties door `+`) en encodeURIComponent (encodeert
// `/` etc.) breken allebei de query. We encoderen alleen de tekens die echt
// niet kunnen in een URL.
function buildQuery(params: Record<string, string>): string {
  const enc = (s: string) =>
    s
      .replace(/%/g, "%25")
      .replace(/ /g, "%20")
      .replace(/#/g, "%23")
      .replace(/&/g, "%26")
      .replace(/\+/g, "%2B");
  return Object.entries(params)
    .map(([k, v]) => `${enc(k)}=${enc(v)}`)
    .join("&");
}

async function odata<T>(path: string): Promise<OData<T>> {
  const url = `${BASE}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    // Next.js: data is per dag opnieuw op te halen (zie API-route revalidate).
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) {
    throw new Error(`TK OData ${res.status} bij ${path}`);
  }
  return res.json();
}

/** Haalt wetsvoorstellen op waar de opgegeven commissie voortouwcommissie is. */
export async function fetchWetsvoorstellenVoorCommissie(
  commissieNaam: string,
  limit = 100,
): Promise<TkZaak[]> {
  const escaped = commissieNaam.replace(/'/g, "''");
  const filter = [
    "Verwijderd eq false",
    "Soort eq 'Wetgeving'",
    `ZaakActor/any(a: a/ActorNaam eq '${escaped}' and a/Relatie eq 'Voortouwcommissie')`,
  ].join(" and ");

  const expand = [
    "Kamerstukdossier($select=Id,Nummer,Titel)",
    "ZaakActor($select=Id,ActorNaam,ActorFractie,Functie,Relatie)",
    "Activiteit($select=Id,Onderwerp,Soort,Status,Datum,Aanvangstijd,Eindtijd,Locatie)",
    "Besluit($select=Id,BesluitTekst,BesluitSoort,StemmingsSoort,Status,Opmerking,GewijzigdOp)",
  ].join(",");

  const qs = buildQuery({
    $filter: filter,
    $expand: expand,
    $orderby: "GestartOp desc",
    $top: String(limit),
  });

  const data = await odata<TkZaak>(`Zaak?${qs}`);
  return data.value;
}

/** Haal één wetsvoorstel volledig op (incl. activiteiten en besluiten). */
export async function fetchWetsvoorstel(id: string): Promise<TkZaak | null> {
  const expand = [
    "Kamerstukdossier",
    "ZaakActor",
    "Activiteit",
    "Besluit($expand=Stemming)",
  ].join(",");
  const qs = buildQuery({ $expand: expand });
  try {
    const res = await fetch(`${BASE}/Zaak(${id})?${qs}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 6 },
    });
    if (!res.ok) return null;
    return (await res.json()) as TkZaak;
  } catch {
    return null;
  }
}

// ---- Normalisatie ----

export function normalize(z: TkZaak): WetVoorstel {
  const actors = z.ZaakActor ?? [];
  const indiener =
    actors.find((a) => a.Relatie === "Indiener")?.ActorNaam ??
    actors.find((a) => a.Functie?.toLowerCase().includes("minister"))
      ?.ActorNaam ??
    null;
  const voortouwcommissie =
    actors.find((a) => a.Relatie === "Voortouwcommissie")?.ActorNaam ?? null;

  const volgendeActiviteit = pickVolgendeActiviteit(z.Activiteit ?? []);
  const laatsteBesluit = pickLaatsteBesluit(z.Besluit ?? []);
  let fase = bepaalFase(z, laatsteBesluit, z.Activiteit ?? []);

  // Verfijn met EK-status indien beschikbaar (overschrijft 'aangenomen_tk'
  // met de werkelijke EK-fase: schriftelijk → plenair → aangenomen → wet).
  if (fase === "aangenomen_tk") {
    const ek = getEkStatus(z.Id);
    if (ek?.gevonden && ek.fase) fase = ek.fase;
  }

  return {
    id: z.Id,
    nummer: z.Nummer,
    titel: cleanTitel(z.Titel),
    onderwerp: z.Onderwerp?.trim() ?? cleanTitel(z.Titel),
    status: z.Status ?? "—",
    fase,
    gestartOp: z.GestartOp,
    afgedaan: z.Afgedaan,
    vergaderjaar: z.Vergaderjaar,
    dossierNummer: z.Kamerstukdossier?.[0]?.Nummer ?? null,
    indiener,
    voortouwcommissie,
    volgendeActiviteit,
    laatsteBesluit,
  };
}

function cleanTitel(t: string): string {
  return t.replace(/\s+/g, " ").trim();
}

function pickVolgendeActiviteit(list: TkActiviteit[]): NormActiviteit | null {
  const nu = Date.now();
  const toekomst = list
    .filter((a) => a.Datum && new Date(a.Datum).getTime() >= nu)
    .sort(
      (a, b) =>
        new Date(a.Datum as string).getTime() -
        new Date(b.Datum as string).getTime(),
    );
  if (toekomst.length > 0) return mapAct(toekomst[0]);
  const verleden = list
    .filter((a) => a.Datum)
    .sort(
      (a, b) =>
        new Date(b.Datum as string).getTime() -
        new Date(a.Datum as string).getTime(),
    );
  return verleden[0] ? mapAct(verleden[0]) : null;
}

function mapAct(a: TkActiviteit): NormActiviteit {
  return {
    id: a.Id,
    onderwerp: a.Onderwerp ?? "Activiteit",
    soort: a.Soort,
    datum: a.Datum,
    status: a.Status,
  };
}

function pickLaatsteBesluit(list: TkBesluit[]): NormBesluit | null {
  if (list.length === 0) return null;
  const sorted = [...list].sort(
    (a, b) =>
      new Date(b.GewijzigdOp ?? 0).getTime() -
      new Date(a.GewijzigdOp ?? 0).getTime(),
  );
  const b = sorted[0];
  return {
    id: b.Id,
    tekst: b.BesluitTekst,
    soort: b.BesluitSoort ?? b.StemmingsSoort,
    status: b.Status,
    gewijzigdOp: b.GewijzigdOp,
  };
}

// Bepaalt waar het wetsvoorstel zich nu bevindt in het wetgevingsproces.
// Bronnen: de laatste Besluit-tekst, de Afgedaan-vlag, en de eerstvolgende/
// meest recente Activiteit. De TK OData kent geen expliciet "in EK"-veld; we
// leiden dat af uit "Afgedaan + Aangenomen door TK".
function bepaalFase(
  z: TkZaak,
  besluit: NormBesluit | null,
  activiteiten: TkActiviteit[],
): Fase {
  const bTekst = (besluit?.tekst ?? "").toLowerCase();
  const bSoort = (besluit?.soort ?? "").toLowerCase();

  // 1. Eindstatussen
  if (bTekst.includes("verworpen") || bSoort.includes("verworpen"))
    return "verworpen";
  if (bTekst.includes("ingetrokken") || bSoort.includes("ingetrokken"))
    return "ingetrokken";

  // 2. Afgedaan + aangenomen → TK klaar, ligt nu in EK (of is al wet)
  if (z.Afgedaan && (bTekst.includes("aangenomen") || bSoort.includes("aangenomen"))) {
    return "aangenomen_tk";
  }

  // 3. Activiteiten classificeren — eerst toekomstige, anders meest recente
  const nu = Date.now();
  const planned = activiteiten
    .filter((a) => a.Datum && new Date(a.Datum).getTime() >= nu)
    .sort(
      (a, b) =>
        new Date(a.Datum as string).getTime() -
        new Date(b.Datum as string).getTime(),
    );
  const recent = activiteiten
    .filter((a) => a.Datum && new Date(a.Datum).getTime() < nu)
    .sort(
      (a, b) =>
        new Date(b.Datum as string).getTime() -
        new Date(a.Datum as string).getTime(),
    );

  const klassificeer = (soort: string): Fase | null => {
    const s = soort.toLowerCase();
    if (s.includes("stemming") || s.includes("hamerstuk")) return "stemming_tk";
    if (
      s.includes("plenair") ||
      s.includes("wetgevingsoverleg") ||
      s.includes("notaoverleg")
    )
      return "plenair_tk";
    if (
      s.includes("commissiedebat") ||
      s.includes("procedurevergadering") ||
      s.includes("inbreng") ||
      s.includes("verslag") ||
      s.includes("schriftelijk overleg")
    )
      return "in_commissie";
    return null;
  };

  // Eerstvolgende geplande activiteit is meest indicatief
  for (const a of planned) {
    const f = klassificeer(a.Soort ?? "");
    if (f) return f;
  }
  // Anders recente activiteit (kijk naar laatste 3)
  for (const a of recent.slice(0, 3)) {
    const f = klassificeer(a.Soort ?? "");
    if (f) return f;
  }

  // 4. Fallback op basis van Zaak.Status
  if (z.Afgedaan) return "wet";
  if (z.Status === "Vrijgegeven") return "in_commissie";
  return "ingediend";
}

// Display-constanten verhuisd naar lib/fase-display.ts zodat client
// components ze kunnen importeren zonder fs/path mee te krijgen.
export { FASE_LABEL, FASE_KLEUR } from "./fase-display";
