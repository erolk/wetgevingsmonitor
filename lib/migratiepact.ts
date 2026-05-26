import { fetchWetsvoorstelByDossier, normalize } from "./tk-api";
import { aggregeerStemming, type StemUitslag } from "./stemming";
import { getEkStatus } from "./ek-status";
import { FASE_LABEL, isAfgerond } from "./fase-display";
import type { Fase, TkBesluit } from "./types";

// Datum waarop de hoofdonderdelen van het EU-migratiepact van toepassing zijn.
// (Verordeningen in werking 11 juni 2024 + 2 jaar overgangstermijn.)
export const PACT_START_ISO = "2026-06-12";

// De dossiers die we volgen. 36871 is de eigenlijke uitvoeringswet van het pact;
// de andere drie vormen het nationale "asielpakket" dat er parallel aan liep en
// dat het kader van het pact mede bepaalt (context).
export type DossierRol = "Uitvoeringswet pact" | "Nationaal asielpakket";

type DossierConfig = { nummer: number; rol: DossierRol; korteNaam: string };

const DOSSIERS: DossierConfig[] = [
  {
    nummer: 36871,
    rol: "Uitvoeringswet pact",
    korteNaam: "Uitvoerings- en implementatiewet Asiel- en migratiepact",
  },
  {
    nummer: 36703,
    rol: "Nationaal asielpakket",
    korteNaam: "Wet invoering tweestatusstelsel",
  },
  {
    nummer: 36704,
    rol: "Nationaal asielpakket",
    korteNaam: "Asielnoodmaatregelenwet",
  },
  {
    nummer: 36855,
    rol: "Nationaal asielpakket",
    korteNaam: "Novelle (aanpassing strafbaarstelling)",
  },
];

export type PactDossier = {
  nummer: number;
  rol: DossierRol;
  korteNaam: string;
  zaakId: string | null;
  titel: string;
  fase: Fase;
  faseLabel: string;
  afgerond: boolean;
  ekLabel: string | null;
  ekUrl: string | null;
  tkStemming: StemUitslag | null;
  tkBesluitSoort: string | null; // "Stemmen - aangenomen" / "...verworpen"
  tkDatum: string | null;
  gevonden: boolean;
};

function tkEindstemming(besluiten: TkBesluit[]): {
  uitslag: StemUitslag;
  besluitSoort: string | null;
  datum: string | null;
} | null {
  const metStemmen = besluiten.filter(
    (b) => Array.isArray(b.Stemming) && b.Stemming.length > 0,
  );
  if (metStemmen.length === 0) return null;
  // Voorkeur voor de eindstemming (aangenomen/verworpen); anders de meest
  // recent gewijzigde stemming.
  const prefer =
    metStemmen.find((b) => /aangenomen|verworpen/i.test(b.BesluitSoort ?? "")) ??
    [...metStemmen].sort(
      (a, b) =>
        new Date(b.GewijzigdOp ?? 0).getTime() -
        new Date(a.GewijzigdOp ?? 0).getTime(),
    )[0];
  return {
    uitslag: aggregeerStemming(prefer.Stemming ?? [], prefer.StemmingsSoort),
    besluitSoort: prefer.BesluitSoort ?? null,
    datum: prefer.GewijzigdOp ?? null,
  };
}

async function laadDossier(cfg: DossierConfig): Promise<PactDossier> {
  const zaken = await fetchWetsvoorstelByDossier(cfg.nummer);
  // Kies de zaak met een eindstemming; anders de eerste wetgeving-zaak.
  const primair =
    zaken.find((z) =>
      (z.Besluit ?? []).some(
        (b) => Array.isArray(b.Stemming) && b.Stemming.length > 0,
      ),
    ) ?? zaken[0];

  if (!primair) {
    return {
      nummer: cfg.nummer,
      rol: cfg.rol,
      korteNaam: cfg.korteNaam,
      zaakId: null,
      titel: cfg.korteNaam,
      fase: "onbekend",
      faseLabel: FASE_LABEL.onbekend,
      afgerond: false,
      ekLabel: null,
      ekUrl: null,
      tkStemming: null,
      tkBesluitSoort: null,
      tkDatum: null,
      gevonden: false,
    };
  }

  const norm = normalize(primair);
  const ek = getEkStatus(primair.Id);
  const stem = tkEindstemming(primair.Besluit ?? []);

  return {
    nummer: cfg.nummer,
    rol: cfg.rol,
    korteNaam: cfg.korteNaam,
    zaakId: primair.Id,
    titel: norm.titel,
    fase: norm.fase,
    faseLabel: FASE_LABEL[norm.fase],
    afgerond: isAfgerond(norm.fase),
    ekLabel: ek?.gevonden ? ek.label ?? null : null,
    ekUrl: ek?.ekUrl ?? null,
    tkStemming: stem?.uitslag ?? null,
    tkBesluitSoort: stem?.besluitSoort ?? null,
    tkDatum: stem?.datum ?? null,
    gevonden: true,
  };
}

export async function getPactDossiers(): Promise<PactDossier[]> {
  return Promise.all(DOSSIERS.map(laadDossier));
}

/** Dagen tot de pact-startdatum (negatief als al begonnen). */
export function dagenTotPactStart(vanaf = new Date()): number {
  const start = new Date(PACT_START_ISO).getTime();
  return Math.ceil((start - vanaf.getTime()) / 86_400_000);
}
