// Woningbouwcijfers per provincie uit CBS StatLine, tabel 81955NED
// ("Voorraad woningen en niet-woningen; mutaties, gebruiksfunctie, regio").
// Bron: https://opendata.cbs.nl/ODataApi/OData/81955NED
//
// LET OP: CBS heeft 81955NED in juni 2025 stopgezet en vervangt 'm door
// "Levensloop van woningen en niet-woningen". Tot die opvolger via OData
// beschikbaar is, gebruiken we 81955NED voor 2024 (definitief jaar) en de
// gedeeltelijke maand-data van 2025. Zodra de opvolger online staat, hier
// migreren.

const BASE = "https://opendata.cbs.nl/ODataApi/OData/81955NED";
const FUNCTIE_WONING = "A045364";

// CBS-provinciecodes en hun officiële namen.
export const PROVINCIES: { code: string; naam: string }[] = [
  { code: "PV20", naam: "Groningen" },
  { code: "PV21", naam: "Fryslân" },
  { code: "PV22", naam: "Drenthe" },
  { code: "PV23", naam: "Overijssel" },
  { code: "PV24", naam: "Flevoland" },
  { code: "PV25", naam: "Gelderland" },
  { code: "PV26", naam: "Utrecht" },
  { code: "PV27", naam: "Noord-Holland" },
  { code: "PV28", naam: "Zuid-Holland" },
  { code: "PV29", naam: "Zeeland" },
  { code: "PV30", naam: "Noord-Brabant" },
  { code: "PV31", naam: "Limburg" },
];

type CbsRow = {
  RegioS: string;
  Perioden: string;
  Nieuwbouw_2: number | null;
};

export type JaarColom = {
  jaar: number;
  /** "definitief" = jaarcijfer, "partial" = som van bekende maandcijfers t/m maand X */
  status: "definitief" | "partial";
  /** alleen relevant bij status="partial": laatste maand met data (1-12) */
  laatsteMaand?: number;
};

export type ProvincieRij = {
  code: string;
  naam: string;
  /** key = jaar, value = aantal nieuwbouwwoningen (of null bij ontbrekend) */
  perJaar: Record<number, number | null>;
};

export type WoningbouwData = {
  jaren: JaarColom[];
  provincies: ProvincieRij[];
  totalenPerJaar: Record<number, number | null>;
  bijgewerkt: string;
  bron: string;
};

const MAAND_NAMEN = [
  "jan", "feb", "mrt", "apr", "mei", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];

export function maandNaam(m: number): string {
  return MAAND_NAMEN[m - 1] ?? "";
}

export async function getWoningbouw(
  startJaar = 2024,
): Promise<WoningbouwData | null> {
  try {
    const filter =
      `startswith(RegioS,'PV') and startswith(Gebruiksfunctie,'${FUNCTIE_WONING}')`;
    const url = `${BASE}/TypedDataSet?$filter=${encodeURIComponent(filter)}&$select=RegioS,Perioden,Nieuwbouw_2`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { value: CbsRow[] };
    const rows = json.value ?? [];

    // Welke jaren hebben definitief JJ-cijfers >= startJaar?
    const jaarJJSet = new Set<number>();
    for (const r of rows) {
      const m = r.Perioden.match(/^(\d{4})JJ00$/);
      if (m) {
        const jaar = Number(m[1]);
        if (jaar >= startJaar) jaarJJSet.add(jaar);
      }
    }
    const definitieveJaren = [...jaarJJSet].sort();

    // Welke jaren hebben (alleen) MM-cijfers waarvan we een partial kunnen
    // bouwen? (jaren waarvoor we GEEN JJ hebben maar wel maand-rijen)
    const partialPerJaarMaand: Record<number, Set<number>> = {};
    for (const r of rows) {
      const m = r.Perioden.match(/^(\d{4})MM(\d{2})$/);
      if (!m) continue;
      const jaar = Number(m[1]);
      const maand = Number(m[2]);
      if (jaar < startJaar) continue;
      if (jaarJJSet.has(jaar)) continue;
      partialPerJaarMaand[jaar] ??= new Set();
      partialPerJaarMaand[jaar].add(maand);
    }
    const partialJaren = Object.keys(partialPerJaarMaand)
      .map(Number)
      .sort();

    const kolommen: JaarColom[] = [
      ...definitieveJaren.map<JaarColom>((j) => ({ jaar: j, status: "definitief" })),
      ...partialJaren.map<JaarColom>((j) => ({
        jaar: j,
        status: "partial",
        laatsteMaand: Math.max(...partialPerJaarMaand[j]),
      })),
    ].sort((a, b) => a.jaar - b.jaar);

    const provincies: ProvincieRij[] = PROVINCIES.map((p) => {
      const perJaar: Record<number, number | null> = {};
      for (const k of kolommen) {
        if (k.status === "definitief") {
          const r = rows.find(
            (x) =>
              x.RegioS.trim() === p.code && x.Perioden === `${k.jaar}JJ00`,
          );
          perJaar[k.jaar] = r?.Nieuwbouw_2 ?? null;
        } else {
          // som van beschikbare maandcijfers
          let som = 0;
          let any = false;
          for (const r of rows) {
            if (r.RegioS.trim() !== p.code) continue;
            const m = r.Perioden.match(/^(\d{4})MM\d{2}$/);
            if (!m || Number(m[1]) !== k.jaar) continue;
            if (r.Nieuwbouw_2 != null) {
              som += r.Nieuwbouw_2;
              any = true;
            }
          }
          perJaar[k.jaar] = any ? som : null;
        }
      }
      return { ...p, perJaar };
    });

    const totalenPerJaar: Record<number, number | null> = {};
    for (const k of kolommen) {
      const som = provincies.reduce(
        (s, p) => s + (p.perJaar[k.jaar] ?? 0),
        0,
      );
      const heeftData = provincies.some((p) => p.perJaar[k.jaar] != null);
      totalenPerJaar[k.jaar] = heeftData ? som : null;
    }

    return {
      jaren: kolommen,
      provincies,
      totalenPerJaar,
      bijgewerkt: new Date().toISOString(),
      bron: "CBS StatLine 81955NED",
    };
  } catch {
    return null;
  }
}
