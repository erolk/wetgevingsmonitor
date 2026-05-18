// Types voor de Tweede Kamer OData v4 API (gegevensmagazijn.tweedekamer.nl)
// Slechts de velden die VolkshuisvestingMonitor gebruikt — niet het volledige schema.

export type TkZaak = {
  Id: string;
  Nummer: string;
  Titel: string;
  Onderwerp: string | null;
  Soort: string;
  Status: string | null;
  GestartOp: string | null;
  Afgedaan: boolean;
  Vergaderjaar: string | null;
  Kamerstukdossier?: TkKamerstukdossier[];
  ZaakActor?: TkZaakActor[];
  Activiteit?: TkActiviteit[];
  Besluit?: TkBesluit[];
};

export type TkKamerstukdossier = {
  Id: string;
  Nummer: number;
  Titel: string | null;
};

export type TkZaakActor = {
  Id: string;
  ActorNaam: string | null;
  ActorFractie: string | null;
  Functie: string | null;
  Relatie: string | null;
};

export type TkActiviteit = {
  Id: string;
  Onderwerp: string | null;
  Soort: string | null;
  Status: string | null;
  Datum: string | null;
  Aanvangstijd: string | null;
  Eindtijd: string | null;
  Locatie: string | null;
};

export type TkBesluit = {
  Id: string;
  BesluitTekst: string | null;
  BesluitSoort: string | null;
  StemmingsSoort: string | null;
  Opmerking: string | null;
  Status: string | null;
  GewijzigdOp: string | null;
  Stemming?: TkStemming[];
  Agendapunt?: TkAgendapunt | null;
};

export type TkAgendapunt = {
  Id: string;
  Nummer: string | null;
  Onderwerp: string | null;
  Status: string | null;
  Activiteit?: TkActiviteit | null;
};

export type TkStemming = {
  Id: string;
  Soort: string | null;
  FractieGrootte: number | null;
  ActorNaam: string | null;
  ActorFractie: string | null;
  Vergissing: boolean | null;
};

// Genormaliseerd model dat de UI consumeert.
export type WetVoorstel = {
  id: string;
  nummer: string;
  titel: string;
  onderwerp: string;
  status: string;
  fase: Fase;
  gestartOp: string | null;
  afgedaan: boolean;
  vergaderjaar: string | null;
  dossierNummer: number | null;
  indiener: string | null;
  voortouwcommissie: string | null;
  volgendeActiviteit: NormActiviteit | null;
  laatsteBesluit: NormBesluit | null;
};

export type Fase =
  | "ingediend"
  | "in_commissie"
  | "plenair_tk"
  | "stemming_tk"
  | "aangenomen_tk"
  | "in_eerste_kamer"
  | "aangenomen_ek"
  | "wet"
  | "verworpen"
  | "ingetrokken"
  | "onbekend";

export type NormActiviteit = {
  id: string;
  onderwerp: string;
  soort: string | null;
  datum: string | null;
  status: string | null;
};

export type NormBesluit = {
  id: string;
  tekst: string | null;
  soort: string | null;
  status: string | null;
  gewijzigdOp: string | null;
};
