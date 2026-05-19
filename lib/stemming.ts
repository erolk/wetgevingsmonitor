import type { TkStemming } from "./types";

export type StemSoort = "Voor" | "Tegen" | "Onthouden" | "Niet deelgenomen";

export type FractieStem = {
  fractie: string;
  voor: number;
  tegen: number;
  onthouden: number;
  nietDeelgenomen: number;
  totaal: number;
  kamerleden: Array<{
    naam: string;
    soort: StemSoort | string;
    vergissing: boolean;
  }>;
};

export type StemUitslag = {
  isHoofdelijk: boolean;
  voor: number;
  tegen: number;
  onthouden: number;
  nietDeelgenomen: number;
  totaal: number;
  perFractie: FractieStem[];
};

function normSoort(s: string | null | undefined): StemSoort {
  const v = (s ?? "").trim().toLowerCase();
  if (v === "voor") return "Voor";
  if (v === "tegen") return "Tegen";
  if (v === "onthouden") return "Onthouden";
  return "Niet deelgenomen";
}

export function aggregeerStemming(
  stemmingen: TkStemming[],
  stemmingsSoort: string | null,
): StemUitslag {
  const isHoofdelijk =
    (stemmingsSoort ?? "").toLowerCase().includes("hoofdelijk");

  const map = new Map<string, FractieStem>();
  let voor = 0;
  let tegen = 0;
  let onthouden = 0;
  let nietDeelgenomen = 0;

  for (const s of stemmingen) {
    const fractie = (s.ActorFractie ?? "Onbekend").trim() || "Onbekend";
    const soort = normSoort(s.Soort);

    if (!map.has(fractie)) {
      map.set(fractie, {
        fractie,
        voor: 0,
        tegen: 0,
        onthouden: 0,
        nietDeelgenomen: 0,
        totaal: 0,
        kamerleden: [],
      });
    }
    const row = map.get(fractie)!;

    if (isHoofdelijk) {
      const gewicht = 1;
      if (soort === "Voor") {
        row.voor += gewicht;
        voor += gewicht;
      } else if (soort === "Tegen") {
        row.tegen += gewicht;
        tegen += gewicht;
      } else if (soort === "Onthouden") {
        row.onthouden += gewicht;
        onthouden += gewicht;
      } else {
        row.nietDeelgenomen += gewicht;
        nietDeelgenomen += gewicht;
      }
      row.totaal += gewicht;
      if (s.ActorNaam) {
        row.kamerleden.push({
          naam: s.ActorNaam,
          soort,
          vergissing: !!s.Vergissing,
        });
      }
    } else {
      const gewicht = s.FractieGrootte ?? 1;
      if (soort === "Voor") {
        row.voor += gewicht;
        voor += gewicht;
      } else if (soort === "Tegen") {
        row.tegen += gewicht;
        tegen += gewicht;
      } else if (soort === "Onthouden") {
        row.onthouden += gewicht;
        onthouden += gewicht;
      } else {
        row.nietDeelgenomen += gewicht;
        nietDeelgenomen += gewicht;
      }
      row.totaal += gewicht;
    }
  }

  const perFractie = Array.from(map.values()).sort((a, b) => {
    if (b.totaal !== a.totaal) return b.totaal - a.totaal;
    return a.fractie.localeCompare(b.fractie, "nl");
  });

  for (const f of perFractie) {
    f.kamerleden.sort((a, b) => a.naam.localeCompare(b.naam, "nl"));
  }

  return {
    isHoofdelijk,
    voor,
    tegen,
    onthouden,
    nietDeelgenomen,
    totaal: voor + tegen + onthouden + nietDeelgenomen,
    perFractie,
  };
}

const PROCEDURELE_PREFIXES = [
  "Controversieel",
  "Verzoek",
  "Inbreng",
  "In handen",
  "Agenderen",
  "Stemmen - uitstellen",
  "[Vrij tekstveld",
  "Aanhouden",
  "Aanvullend",
];

export function isStemmingBesluit(besluit: {
  StemmingsSoort?: string | null;
  BesluitSoort?: string | null;
  Stemming?: { length: number } | unknown;
}): boolean {
  if (
    Array.isArray(besluit.Stemming) &&
    (besluit.Stemming as unknown[]).length > 0
  )
    return true;
  const soort = besluit.BesluitSoort ?? "";
  if (/^Stemmen -/i.test(soort) && !/uitstellen/i.test(soort)) return true;
  return false;
}

export function isProcedureelBesluit(besluit: {
  BesluitSoort?: string | null;
}): boolean {
  const soort = besluit.BesluitSoort ?? "";
  return PROCEDURELE_PREFIXES.some((p) =>
    soort.toLowerCase().startsWith(p.toLowerCase()),
  );
}
