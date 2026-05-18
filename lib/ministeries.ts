// 15 ministeries / portefeuilles (kabinet-Schoof, 2024-heden).
// Volgorde = protocolaire volgorde zoals gehanteerd op rijksoverheid.nl.
// `commissie` = exacte NaamNL van de vaste TK-commissie zoals die voorkomt in
// ZaakActor.ActorNaam (lowercase 'vaste commissie ...').
// Bron: TK Open Data Commissie endpoint, gefilterd op actieve vaste commissies.

export type Ministerie = {
  slug: string;
  naam: string;
  korteNaam: string;
  afkorting: string;
  commissie: string;
  beschrijving: string;
  kleur: string;
};

export const MINISTERIES: Ministerie[] = [
  {
    slug: "buitenlandse-zaken",
    naam: "Buitenlandse Zaken",
    korteNaam: "Buitenlandse Zaken",
    afkorting: "BZ",
    commissie: "vaste commissie voor Buitenlandse Zaken",
    beschrijving: "Diplomatie, EU-besluiten, sancties, mensenrechten.",
    kleur: "ministerie-tile",
  },
  {
    slug: "justitie-en-veiligheid",
    naam: "Justitie en Veiligheid",
    korteNaam: "Justitie en Veiligheid",
    afkorting: "JenV",
    commissie: "vaste commissie voor Justitie en Veiligheid",
    beschrijving: "Strafrecht, politie, rechterlijke macht, terrorismebestrijding.",
    kleur: "ministerie-tile",
  },
  {
    slug: "binnenlandse-zaken",
    naam: "Binnenlandse Zaken en Koninkrijksrelaties",
    korteNaam: "Binnenlandse Zaken",
    afkorting: "BZK",
    commissie: "vaste commissie voor Binnenlandse Zaken",
    beschrijving: "Democratie, gemeenten, overheidsorganisatie, AVG en grondrechten.",
    kleur: "ministerie-tile",
  },
  {
    slug: "onderwijs-cultuur-wetenschap",
    naam: "Onderwijs, Cultuur en Wetenschap",
    korteNaam: "Onderwijs, Cultuur en Wetenschap",
    afkorting: "OCW",
    commissie: "vaste commissie voor Onderwijs, Cultuur en Wetenschap",
    beschrijving: "Scholen, universiteiten, cultuur, media, wetenschap.",
    kleur: "ministerie-tile",
  },
  {
    slug: "financien",
    naam: "Financiën",
    korteNaam: "Financiën",
    afkorting: "FIN",
    commissie: "vaste commissie voor Financiën",
    beschrijving: "Belastingen, begroting, financiële sector, btw.",
    kleur: "ministerie-tile",
  },
  {
    slug: "defensie",
    naam: "Defensie",
    korteNaam: "Defensie",
    afkorting: "DEF",
    commissie: "vaste commissie voor Defensie",
    beschrijving: "Krijgsmacht, militair personeel, internationale missies.",
    kleur: "ministerie-tile",
  },
  {
    slug: "infrastructuur-en-waterstaat",
    naam: "Infrastructuur en Waterstaat",
    korteNaam: "Infrastructuur en Waterstaat",
    afkorting: "IenW",
    commissie: "vaste commissie voor Infrastructuur en Waterstaat",
    beschrijving: "Wegen, OV, water, luchtvaart, milieuwetgeving.",
    kleur: "ministerie-tile",
  },
  {
    slug: "economische-zaken",
    naam: "Economische Zaken",
    korteNaam: "Economische Zaken",
    afkorting: "EZ",
    commissie: "vaste commissie voor Economische Zaken",
    beschrijving: "Bedrijfsleven, mkb, mededinging, innovatie.",
    kleur: "ministerie-tile",
  },
  {
    slug: "klimaat-en-groene-groei",
    naam: "Klimaat en Groene Groei",
    korteNaam: "Klimaat en Groene Groei",
    afkorting: "KGG",
    commissie: "vaste commissie voor Klimaat en Groene Groei",
    beschrijving: "Klimaatbeleid, energie, CO₂, verduurzaming, gasvrij wonen.",
    kleur: "ministerie-tile",
  },
  {
    slug: "landbouw-en-natuur",
    naam: "Landbouw, Visserij, Voedselzekerheid en Natuur",
    korteNaam: "Landbouw, Visserij, Voedselzekerheid en Natuur",
    afkorting: "LVVN",
    commissie:
      "vaste commissie voor Landbouw, Visserij, Voedselzekerheid en Natuur",
    beschrijving: "Boeren, stikstof, voedselveiligheid, natuurbeheer.",
    kleur: "ministerie-tile",
  },
  {
    slug: "sociale-zaken",
    naam: "Sociale Zaken en Werkgelegenheid",
    korteNaam: "Sociale Zaken en Werkgelegenheid",
    afkorting: "SZW",
    commissie: "vaste commissie voor Sociale Zaken en Werkgelegenheid",
    beschrijving: "Uitkeringen, AOW, pensioenen, arbeidsrecht, kinderopvang.",
    kleur: "ministerie-tile",
  },
  {
    slug: "volksgezondheid",
    naam: "Volksgezondheid, Welzijn en Sport",
    korteNaam: "Volksgezondheid, Welzijn en Sport",
    afkorting: "VWS",
    commissie: "vaste commissie voor Volksgezondheid, Welzijn en Sport",
    beschrijving: "Zorgverzekering, ziekenhuizen, ouderenzorg, jeugdzorg, sport.",
    kleur: "ministerie-tile",
  },
  {
    slug: "asiel-en-migratie",
    naam: "Asiel en Migratie",
    korteNaam: "Asiel en Migratie",
    afkorting: "AenM",
    commissie: "vaste commissie voor Asiel en Migratie",
    beschrijving: "Asielprocedures, vreemdelingenrecht, opvang.",
    kleur: "ministerie-tile",
  },
  {
    slug: "volkshuisvesting-en-ruimtelijke-ordening",
    naam: "Volkshuisvesting en Ruimtelijke Ordening",
    korteNaam: "Volkshuisvesting en Ruimtelijke Ordening",
    afkorting: "VRO",
    commissie: "vaste commissie voor Volkshuisvesting en Ruimtelijke Ordening",
    beschrijving: "Woningbouw, huurregels, ruimtelijke ordening en de Omgevingswet.",
    kleur: "ministerie-tile",
  },
  {
    slug: "buitenlandse-handel-en-ontwikkeling",
    naam: "Buitenlandse Handel en Ontwikkelingssamenwerking",
    korteNaam: "Buitenlandse Handel en Ontwikkelingssamenwerking",
    afkorting: "BHO",
    commissie:
      "vaste commissie voor Buitenlandse Handel en Ontwikkelingssamenwerking",
    beschrijving: "Internationale handel, ontwikkelingshulp, exportcontroles.",
    kleur: "ministerie-tile",
  },
];

export function getMinisterie(slug: string): Ministerie | undefined {
  return MINISTERIES.find((m) => m.slug === slug);
}

export function getMinisterieByCommissie(naam: string): Ministerie | undefined {
  return MINISTERIES.find((m) => m.commissie === naam);
}
