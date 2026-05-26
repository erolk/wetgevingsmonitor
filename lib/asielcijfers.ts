// Asielcijfers uit CBS StatLine (tabel 83102NED), via de open OData v3-API.
// Bron: https://opendata.cbs.nl/ODataApi/OData/83102NED
//
// Dimensies: Geslacht, Leeftijd, Nationaliteit, Perioden. We filteren op de
// totaal-codes (T001038 geslacht, 10000 leeftijd) en gebruiken de totaal-
// nationaliteit (T001059) voor de instroomtrend, of alle nationaliteiten voor
// het jaaroverzicht. Maatcijfers: totaal / eerste / volgende / nareizigers.
//
// Alles met graceful fallback: faalt CBS, dan geeft de laag null/lege data
// terug en toont de pagina een nette melding i.p.v. te crashen.

const BASE = "https://opendata.cbs.nl/ODataApi/OData/83102NED";

const GESLACHT_TOTAAL = "T001038";
const LEEFTIJD_TOTAAL = "10000";
const NATIONALITEIT_TOTAAL = "T001059";

type CbsRow = {
  Geslacht: string;
  Leeftijd: string;
  Nationaliteit: string;
  Perioden: string;
  TotaalAsielverzoeken_1: number | null;
  EersteAsielverzoekenPersonen_2: number | null;
  VolgendeAsielverzoeken_3: number | null;
  NareizigersPersonen_4: number | null;
};

// CBS-dimensiecodes zijn met spaties opgevuld tot een vaste breedte (bv.
// "T001059  "), dus `eq` matcht niet betrouwbaar. We filteren met startswith.
function buildFilter(parts: Record<string, string>): string {
  const filter = Object.entries(parts)
    .map(([k, v]) => `startswith(${k},'${v}')`)
    .join(" and ");
  return filter.replace(/ /g, "%20");
}

async function cbs<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`CBS OData ${res.status}`);
  const json = (await res.json()) as { value: T[] };
  return json.value ?? [];
}

const MAAND_NAMEN = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

/** "2026MM03" -> { jaar: 2026, maand: 3, label: "mrt 2026", iso: "2026-03" } */
function parseMaandPeriode(code: string) {
  const jaar = Number(code.slice(0, 4));
  const maand = Number(code.slice(6, 8));
  return {
    code,
    jaar,
    maand,
    iso: `${jaar}-${String(maand).padStart(2, "0")}`,
    label: `${MAAND_NAMEN[maand - 1]} ${jaar}`,
  };
}

export type MaandInstroom = {
  code: string;
  jaar: number;
  maand: number;
  iso: string;
  label: string;
  totaal: number | null;
  eerste: number | null;
  volgende: number | null;
  nareizigers: number | null;
};

export type InstroomMaandData = {
  maanden: MaandInstroom[]; // chronologisch, laatste ~36 maanden
  laatsteMaand: MaandInstroom | null;
  bron: string;
};

/** Maandelijkse asielinstroom (totaal-nationaliteit), laatste ~36 maanden. */
export async function getMaandInstroom(
  aantalMaanden = 36,
): Promise<InstroomMaandData | null> {
  try {
    const filter = buildFilter({
      Geslacht: GESLACHT_TOTAAL,
      Leeftijd: LEEFTIJD_TOTAAL,
      Nationaliteit: NATIONALITEIT_TOTAAL,
    });
    const rows = await cbs<CbsRow>(`TypedDataSet?$filter=${filter}`);
    const maanden = rows
      .filter((r) => /^\d{4}MM\d{2}$/.test(r.Perioden))
      .map((r) => {
        const p = parseMaandPeriode(r.Perioden);
        return {
          ...p,
          totaal: r.TotaalAsielverzoeken_1,
          eerste: r.EersteAsielverzoekenPersonen_2,
          volgende: r.VolgendeAsielverzoeken_3,
          nareizigers: r.NareizigersPersonen_4,
        };
      })
      .filter((m) => m.totaal != null)
      .sort((a, b) => a.code.localeCompare(b.code));

    const laatste = maanden.slice(-aantalMaanden);
    return {
      maanden: laatste,
      laatsteMaand: laatste[laatste.length - 1] ?? null,
      bron: "CBS StatLine 83102NED",
    };
  } catch {
    return null;
  }
}

export type NationaliteitRij = {
  nationaliteit: string;
  eerste: number | null;
  totaal: number | null;
};

export type NationaliteitenData = {
  jaar: number;
  rijen: NationaliteitRij[]; // gesorteerd, hoogste eerst
  bron: string;
};

/** Top-nationaliteiten (eerste asielverzoeken) voor het meest recente
 * volledige jaar in CBS. */
export async function getNationaliteitenPerJaar(
  topN = 15,
): Promise<NationaliteitenData | null> {
  try {
    // 1. Bepaal het meest recente jaar (JJ00-periode) met data via de totaalreeks.
    const totaalFilter = buildFilter({
      Geslacht: GESLACHT_TOTAAL,
      Leeftijd: LEEFTIJD_TOTAAL,
      Nationaliteit: NATIONALITEIT_TOTAAL,
    });
    const totaalRows = await cbs<CbsRow>(`TypedDataSet?$filter=${totaalFilter}`);
    const jaren = totaalRows
      .filter(
        (r) => /^\d{4}JJ00$/.test(r.Perioden) && r.TotaalAsielverzoeken_1 != null,
      )
      .map((r) => r.Perioden)
      .sort();
    const jaarCode = jaren[jaren.length - 1];
    if (!jaarCode) return null;
    const jaar = Number(jaarCode.slice(0, 4));

    // 2. Alle nationaliteiten voor dat jaar.
    const natFilter =
      buildFilter({
        Geslacht: GESLACHT_TOTAAL,
        Leeftijd: LEEFTIJD_TOTAAL,
      }) + `%20and%20Perioden%20eq%20'${jaarCode}'`;
    // (Perioden is niet opgevuld, dus eq werkt hier wel.)
    const rows = await cbs<CbsRow>(`TypedDataSet?$filter=${natFilter}`);

    const rijen = rows
      .filter(
        (r) =>
          // Codes zijn met spaties opgevuld; vergelijk getrimd om de
          // "Totaal"-nationaliteit (T001059) eruit te filteren.
          r.Nationaliteit.trim() !== NATIONALITEIT_TOTAAL &&
          (r.EersteAsielverzoekenPersonen_2 != null ||
            r.TotaalAsielverzoeken_1 != null),
      )
      .map((r) => ({
        natCode: r.Nationaliteit,
        eerste: r.EersteAsielverzoekenPersonen_2,
        totaal: r.TotaalAsielverzoeken_1,
      }))
      .sort((a, b) => (b.eerste ?? 0) - (a.eerste ?? 0))
      .slice(0, topN);

    // 3. Codes -> labels via de Nationaliteit-dimensie.
    const dim = await cbs<{ Key: string; Title: string }>("Nationaliteit");
    const labelVan = new Map(dim.map((d) => [d.Key, d.Title.trim()]));

    return {
      jaar,
      rijen: rijen.map((r) => ({
        nationaliteit: labelVan.get(r.natCode) ?? r.natCode,
        eerste: r.eerste,
        totaal: r.totaal,
      })),
      bron: "CBS StatLine 83102NED",
    };
  } catch {
    return null;
  }
}
