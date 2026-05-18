import type { Fase } from "./types";

export type ProcesStap = {
  id: string;
  korteNaam: string;
  volledigeNaam: string;
  uitleg: string;
  waar: "Ministerie" | "Raad van State" | "Tweede Kamer" | "Eerste Kamer" | "Koning + Staatsblad";
};

// De 8 stappen van het Nederlandse wetgevingsproces. Volgorde is chronologisch.
export const PROCES_STAPPEN: ProcesStap[] = [
  {
    id: "ministerie",
    korteNaam: "Ministerie",
    volledigeNaam: "Voorbereiding bij ministerie",
    uitleg:
      "Het ministerie schrijft het wetsvoorstel. Vaak na een internetconsultatie waarin burgers en organisaties mogen reageren.",
    waar: "Ministerie",
  },
  {
    id: "rvs",
    korteNaam: "Raad van State",
    volledigeNaam: "Advies Raad van State",
    uitleg:
      "De Raad van State adviseert verplicht over elk wetsvoorstel. Dit advies is niet bindend, maar het kabinet moet het serieus wegen en publiek beantwoorden.",
    waar: "Raad van State",
  },
  {
    id: "tk_ingediend",
    korteNaam: "Indiening TK",
    volledigeNaam: "Indiening bij Tweede Kamer",
    uitleg:
      "De Koning stuurt het voorstel officieel naar de Tweede Kamer. Vanaf nu is het openbaar.",
    waar: "Tweede Kamer",
  },
  {
    id: "tk_commissie",
    korteNaam: "Commissie TK",
    volledigeNaam: "Behandeling in TK-commissie",
    uitleg:
      "De vaste commissie van het betreffende thema (bv. Volkshuisvesting) bestudeert het. Er volgen schriftelijke rondes: leden stellen vragen, de minister antwoordt. Soms ook hoorzittingen.",
    waar: "Tweede Kamer",
  },
  {
    id: "tk_plenair",
    korteNaam: "Plenair debat TK",
    volledigeNaam: "Plenair debat Tweede Kamer",
    uitleg:
      "Het debat in de plenaire zaal (de grote zaal). Hier dienen Kamerleden amendementen en moties in. Soms is dit een wetgevingsoverleg of notaoverleg.",
    waar: "Tweede Kamer",
  },
  {
    id: "tk_stemming",
    korteNaam: "Stemming TK",
    volledigeNaam: "Stemming Tweede Kamer",
    uitleg:
      "De Tweede Kamer stemt. Eerst over amendementen, dan over het hele voorstel. Bij voldoende meerderheid → door naar de Eerste Kamer. Hamerstuk = aangenomen zonder stemming.",
    waar: "Tweede Kamer",
  },
  {
    id: "ek",
    korteNaam: "Eerste Kamer",
    volledigeNaam: "Behandeling en stemming Eerste Kamer",
    uitleg:
      "De Eerste Kamer toetst de wet op uitvoerbaarheid en juridische kwaliteit. Geen amendementen meer mogelijk — alleen ja of nee. Verwerping is zeldzaam maar gebeurt.",
    waar: "Eerste Kamer",
  },
  {
    id: "wet",
    korteNaam: "Wet",
    volledigeNaam: "Bekrachtigd en gepubliceerd",
    uitleg:
      "De Koning en de minister ondertekenen (bekrachtiging). De wet wordt gepubliceerd in het Staatsblad en treedt in werking op een afgesproken datum — vaak 1 januari of 1 juli.",
    waar: "Koning + Staatsblad",
  },
];

// Mapping van Fase → index van de huidige stap in PROCES_STAPPEN.
// "Voltooide" stappen (alles ervoor) krijgen automatisch een afgevinkt-marker.
const FASE_NAAR_STAPINDEX: Record<Fase, number> = {
  ingediend: 2,
  in_commissie: 3,
  plenair_tk: 4,
  stemming_tk: 5,
  aangenomen_tk: 6,
  in_eerste_kamer: 6,
  aangenomen_ek: 7,
  wet: 7,
  verworpen: -1,
  ingetrokken: -1,
  onbekend: 0,
};

export type StapStatus = "voltooid" | "bezig" | "toekomst" | "overgeslagen";

export function stapStatussen(fase: Fase): StapStatus[] {
  if (fase === "verworpen" || fase === "ingetrokken") {
    // Alleen de eerste stappen tot stemming TK zijn doorlopen, daarna gestopt
    return PROCES_STAPPEN.map((_, i) =>
      i <= 5 ? "voltooid" : "overgeslagen",
    );
  }
  const huidig = FASE_NAAR_STAPINDEX[fase];
  return PROCES_STAPPEN.map((_, i) => {
    if (i < huidig) return "voltooid";
    if (i === huidig) return "bezig";
    return "toekomst";
  });
}
