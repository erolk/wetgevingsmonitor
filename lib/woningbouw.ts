// Woningbouwcijfers per provincie uit CBS StatLine, tabel 86098NED
// ("Levensloop van woningen en niet-woningen; gebruiksfunctie, regio").
// Bron: https://opendata.cbs.nl/ODataApi/OData/86098NED
//
// 86098NED is per medio 2025 de opvolger van het stopgezette 81955NED.
// Dezelfde dimensies (RegioS, Gebruiksfunctie, Perioden), maar de meting
// heet hier "NieuwbouwTotaal_6" i.p.v. "Nieuwbouw_2". Data t/m enkele
// maanden geleden (CBS publiceert maandcijfers met ~2 maanden vertraging).

const BASE = "https://opendata.cbs.nl/ODataApi/OData/86098NED";
const FUNCTIE_WONING = "A045364";
// Metingen die we gebruiken. "Totaal toegevoegd" = nieuwbouw + andere
// toevoegingen (verbouw/splitsen) + functiewijziging die een pand woning maakt.
const M_NIEUWBOUW = "NieuwbouwTotaal_6";
const M_TOEVOEGINGEN = "ToevoegingenTotaal_13";
const M_FUNCTIEWIJZIGING_POS = "WijzigingGebruiksfunctiePositief_9";

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
  NieuwbouwTotaal_6: number | null;
  ToevoegingenTotaal_13: number | null;
  WijzigingGebruiksfunctiePositief_9: number | null;
};

export type JaarCijfers = {
  nieuwbouw: number | null;
  toegevoegd: number | null;
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
  /** key = jaar, value = cijfers voor nieuwbouw + totaal toegevoegd */
  perJaar: Record<number, JaarCijfers>;
};

export type WoningbouwData = {
  jaren: JaarColom[];
  provincies: ProvincieRij[];
  totalenPerJaar: Record<number, JaarCijfers>;
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
    const select = [
      "RegioS",
      "Perioden",
      M_NIEUWBOUW,
      M_TOEVOEGINGEN,
      M_FUNCTIEWIJZIGING_POS,
    ].join(",");
    const url = `${BASE}/TypedDataSet?$filter=${encodeURIComponent(filter)}&$select=${select}`;
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

    function toegevoegdVan(r: CbsRow): number | null {
      const n = r.NieuwbouwTotaal_6;
      const t = r.ToevoegingenTotaal_13;
      const f = r.WijzigingGebruiksfunctiePositief_9;
      if (n == null && t == null && f == null) return null;
      return (n ?? 0) + (t ?? 0) + (f ?? 0);
    }

    const provincies: ProvincieRij[] = PROVINCIES.map((p) => {
      const perJaar: Record<number, JaarCijfers> = {};
      for (const k of kolommen) {
        if (k.status === "definitief") {
          const r = rows.find(
            (x) =>
              x.RegioS.trim() === p.code && x.Perioden === `${k.jaar}JJ00`,
          );
          perJaar[k.jaar] = {
            nieuwbouw: r?.NieuwbouwTotaal_6 ?? null,
            toegevoegd: r ? toegevoegdVan(r) : null,
          };
        } else {
          // partial: som maandcijfers
          let sNieuw = 0,
            sToeg = 0;
          let anyN = false,
            anyT = false;
          for (const r of rows) {
            if (r.RegioS.trim() !== p.code) continue;
            const m = r.Perioden.match(/^(\d{4})MM\d{2}$/);
            if (!m || Number(m[1]) !== k.jaar) continue;
            if (r.NieuwbouwTotaal_6 != null) {
              sNieuw += r.NieuwbouwTotaal_6;
              anyN = true;
            }
            const tg = toegevoegdVan(r);
            if (tg != null) {
              sToeg += tg;
              anyT = true;
            }
          }
          perJaar[k.jaar] = {
            nieuwbouw: anyN ? sNieuw : null,
            toegevoegd: anyT ? sToeg : null,
          };
        }
      }
      return { ...p, perJaar };
    });

    const totalenPerJaar: Record<number, JaarCijfers> = {};
    for (const k of kolommen) {
      const sNieuw = provincies.reduce(
        (s, p) => s + (p.perJaar[k.jaar].nieuwbouw ?? 0),
        0,
      );
      const sToeg = provincies.reduce(
        (s, p) => s + (p.perJaar[k.jaar].toegevoegd ?? 0),
        0,
      );
      const heeftN = provincies.some((p) => p.perJaar[k.jaar].nieuwbouw != null);
      const heeftT = provincies.some((p) => p.perJaar[k.jaar].toegevoegd != null);
      totalenPerJaar[k.jaar] = {
        nieuwbouw: heeftN ? sNieuw : null,
        toegevoegd: heeftT ? sToeg : null,
      };
    }

    return {
      jaren: kolommen,
      provincies,
      totalenPerJaar,
      bijgewerkt: new Date().toISOString(),
      bron: "CBS StatLine 86098NED",
    };
  } catch {
    return null;
  }
}
