import type { Dictionary } from "./types";

export const nl: Dictionary = {
  common: {
    languageToggle: "EN",
    languageCurrent: "Nederlands",
  },

  nav: {
    siteName: "Wetgevings",
    siteAccent: "monitor",
    ministries: "Ministeries",
    process: "Hoe werkt het?",
    processShort: "Proces",
    about: "Over",
    contact: "Contact",
    searchTitle: "Zoeken",
    searchAria: "Zoek in alle wetsvoorstellen",
  },

  footer: {
    source: "Brongegevens: Tweede Kamer Open Data (CC0).",
    notOfficial:
      "Deze website is geen officiële website van de Rijksoverheid.",
    follow: "Volg ons:",
    contact: "Contact",
    blueskyAria: "Wetgevingsmonitor op Bluesky",
    instagramAria: "Wetgevingsmonitor op Instagram",
  },

  home: {
    title: "Welke wetten worden er momenteel gemaakt en behandeld?",
    intro:
      "Per ministerie zie je live welke wetten in behandeling zijn, waar ze zich bevinden in het proces, en wanneer er weer over wordt gestemd of gedebatteerd. Direct uit de openbare data van de Tweede Kamer.",
    statsRunning:
      "lopende wetsvoorstellen op dit moment, {totaal} totaal in behandeling of recent afgerond.",
    lastSync:
      "Laatst gesynchroniseerd met TK-API op {datum} · ververst automatisch elke 24 uur (wet-detailpagina's elke 6 uur)",
    weekStripTitle: "Deze week op de TK-agenda",
    weekStripWeekLabel: "— week {n}",
    weekStripEmpty:
      "Geen wetsvoorstellen op de Tweede Kamer-agenda deze week.",
    weekStripNoBehandeling: "geen behandeling",
    weekStripCountSingular: "{n} wet",
    weekStripCountPlural: "{n} wetten",
    weekStripShowMore: "Toon overige {aantal} debaten deze week ↓",
    weekStripShowLess: "Toon minder ↑",
    weekStripDebatDirectAria: "Bekijk debat op Debat Direct",
    chooseMinistry: "Kies een ministerie",
    tileRunning: "lopend",
    tileTotal: "{n} totaal",
    tileNext: "eerstvolgend op {datum}",
    bottomDisclaimer:
      "Brongegevens: Tweede Kamer Open Data (CC0). Burger-uitleg per wet wordt automatisch gegenereerd met behulp van AI op basis van de officiële titel en het onderwerp. Deze website is geen officiële website van de Rijksoverheid.",
  },

  contact: {
    title: "Contact",
    intro:
      "Vraag, opmerking, typfout gevonden of een idee voor een verbetering? Stuur het hieronder. Berichten komen rechtstreeks bij de beheerder terecht — geen mailinglijst, geen automatisch antwoord.",
    successHint:
      "We reageren meestal binnen een paar dagen op het opgegeven e-mailadres.",
    formName: "Naam",
    formNamePlaceholder: "Jouw naam",
    formEmail: "E-mailadres",
    formEmailPlaceholder: "naam@voorbeeld.nl",
    formMessage: "Opmerkingen / vraag",
    formMessagePlaceholder:
      "Vraag, opmerking, verbetering of typfout? Laat het weten.",
    formCharCounter: "{n}/5000",
    formConsent:
      "Ik wil dat mijn naam en e-mailadres alleen gebruikt worden om antwoord te kunnen krijgen en niet verder worden gedeeld.",
    formSubmit: "Verstuur bericht",
    formSubmitting: "Versturen…",
    formGenericError: "Kon bericht niet versturen",
    footerNote:
      "We gebruiken je gegevens alleen om te kunnen reageren. Berichten worden niet doorgestuurd, gepubliceerd of gedeeld met derden.",
    privacyTitle:
      "Voor inhoudelijke vragen over wetsvoorstellen zelf: kijk altijd ook op tweedekamer.nl of eerstekamer.nl.",
  },

  about: {
    title: "Over deze site",
    para1:
      "Wetgevingsmonitor maakt zichtbaar welke wetten er op dit moment in Den Haag op tafel liggen, per ministerie. Voor elk wetsvoorstel zie je waar het zich nu bevindt in het proces, wat de eerstvolgende activiteit is (debat, stemming, behandeling in commissie), en — in begrijpelijke taal — wat het voor een gewone burger betekent.",
    para2:
      "De site is onafhankelijk, niet-commercieel, en heeft geen banden met de Rijksoverheid of welke politieke partij dan ook. Doel: laten zien dat de politiek wel degelijk inhoudelijk bezig is, en niet alleen aan het vergaderen is.",
    sourcesTitle: "Gebruikte bronnen",
    sourceTkLabel: "Tweede Kamer Open Data",
    sourceTkDescription:
      "OData v4 API, basisendpoint {endpoint}. Licentie: CC0.",
    sourceKoopLabel: "KOOP / officielebekendmakingen.nl",
    sourceKoopDescription:
      "bron voor Staatsblad en Kamerstukken (toekomstige uitbreiding).",
    sourceWettenLabel: "wetten.overheid.nl",
    sourceWettenDescription:
      "geldende wettekst als een voorstel wet is geworden.",
    explanationTitle: "Burger-uitleg",
    explanationBody:
      "Bij elk wetsvoorstel staat een korte uitleg in begrijpelijke taal. Deze wordt automatisch gegenereerd met behulp van AI (Claude) op basis van de officiële titel en het onderwerp uit de Tweede Kamer-bron. Deze uitleg is bedoeld als hulp bij het begrijpen — voor juridische details raadpleeg altijd de officiële stukken.",
    howMinistryTitle: 'Hoe wordt "ministerie" bepaald?',
    howMinistryBody:
      "De Tweede Kamer legt per zaak vast welke vaste commissie het voortouw heeft in de behandeling. Iedere vaste commissie correspondeert met één ministerie. We groeperen wetsvoorstellen op die voortouwcommissie.",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "Hoewel de brongegevens open en betrouwbaar zijn, kan er vertraging of een weergavefout in zitten. Voor besluitvorming altijd de officiële bron raadplegen. Deze website is geen officiële website van de Rijksoverheid.",
  },

  proces: {
    title: "Hoe wordt een wet gemaakt?",
    intro:
      'Een wetsvoorstel doorloopt acht stappen voordat het echt "wet" wordt. Sommige stappen duren weken, andere maanden of jaren. Bij elke wet op deze site zie je in welke stap die zich nu bevindt.',
    exampleNote:
      "Voorbeeld: een wet die nu in een plenair debat in de Tweede Kamer ligt. Voltooide stappen hebben een vinkje, de huidige stap pulseert rood, toekomstige stappen zijn open cirkels.",
    stepsTitle: "De acht stappen",
    waarLabel: "waar:",
    rejectedTitle: "Wat als een wet wordt verworpen?",
    rejectedBody:
      "Als de Tweede of Eerste Kamer een voorstel verwerpt, stopt het proces. De minister kan een nieuw, aangepast voorstel indienen — dan begint het proces opnieuw bij stap 1. Een minister kan een voorstel ook intrekken voordat er gestemd wordt, bijvoorbeeld als duidelijk is dat er geen meerderheid voor is.",
    enactTitle: "Wanneer treedt een wet in werking?",
    enactBody:
      "De ondertekening door de Koning en de publicatie in het Staatsblad maken een voorstel formeel tot wet. De daadwerkelijke inwerkingtreding gebeurt vaak pas later — meestal op een vaste datum (1 januari of 1 juli), of als de uitvoeringsorganisatie klaar is. Soms staat de inwerkingtreding al in de wet zelf, soms wordt die later bij koninklijk besluit bepaald.",
    sourcesPrefix: "Bron en achtergrond:",
    sourceTk: "tweedekamer.nl — Hoe komt een wet tot stand",
    sourceEk: "eerstekamer.nl — Wetgeving",
    stappen: {
      ministerie: {
        korteNaam: "Ministerie",
        volledigeNaam: "Voorbereiding bij ministerie",
        uitleg:
          "Het ministerie schrijft het wetsvoorstel. Vaak na een internetconsultatie waarin burgers en organisaties mogen reageren.",
        waar: "Ministerie",
      },
      rvs: {
        korteNaam: "Raad van State",
        volledigeNaam: "Advies Raad van State",
        uitleg:
          "De Raad van State adviseert verplicht over elk wetsvoorstel. Dit advies is niet bindend, maar het kabinet moet het serieus wegen en publiek beantwoorden.",
        waar: "Raad van State",
      },
      tk_ingediend: {
        korteNaam: "Indiening TK",
        volledigeNaam: "Indiening bij Tweede Kamer",
        uitleg:
          "De Koning stuurt het voorstel officieel naar de Tweede Kamer. Vanaf nu is het openbaar.",
        waar: "Tweede Kamer",
      },
      tk_commissie: {
        korteNaam: "Commissie TK",
        volledigeNaam: "Behandeling in TK-commissie",
        uitleg:
          "De vaste commissie van het betreffende thema (bv. Volkshuisvesting) bestudeert het. Er volgen schriftelijke rondes: leden stellen vragen, de minister antwoordt. Soms ook hoorzittingen.",
        waar: "Tweede Kamer",
      },
      tk_plenair: {
        korteNaam: "Plenair debat TK",
        volledigeNaam: "Plenair debat Tweede Kamer",
        uitleg:
          "Het debat in de plenaire zaal (de grote zaal). Hier dienen Kamerleden amendementen en moties in. Soms is dit een wetgevingsoverleg of notaoverleg.",
        waar: "Tweede Kamer",
      },
      tk_stemming: {
        korteNaam: "Stemming TK",
        volledigeNaam: "Stemming Tweede Kamer",
        uitleg:
          "De Tweede Kamer stemt. Eerst over amendementen, dan over het hele voorstel. Bij voldoende meerderheid → door naar de Eerste Kamer. Hamerstuk = aangenomen zonder stemming.",
        waar: "Tweede Kamer",
      },
      ek: {
        korteNaam: "Eerste Kamer",
        volledigeNaam: "Behandeling en stemming Eerste Kamer",
        uitleg:
          "De Eerste Kamer toetst de wet op uitvoerbaarheid en juridische kwaliteit. Geen amendementen meer mogelijk — alleen ja of nee. Verwerping is zeldzaam maar gebeurt.",
        waar: "Eerste Kamer",
      },
      wet: {
        korteNaam: "Wet",
        volledigeNaam: "Bekrachtigd en gepubliceerd",
        uitleg:
          "De Koning en de minister ondertekenen (bekrachtiging). De wet wordt gepubliceerd in het Staatsblad en treedt in werking op een afgesproken datum — vaak 1 januari of 1 juli.",
        waar: "Koning + Staatsblad",
      },
    },
  },

  ministery: {
    backToAll: "← alle ministeries",
    subscribeNote:
      "Mail bij elk debat, stemming of besluit op een wet van dit ministerie.",
    runningTitle: "Lopende wetsvoorstellen",
    completedTitle: "Afgerond / verworpen",
    showMore: "Toon overige {aantal} wetsvoorstellen ↓",
    showLess: "Toon minder ↑",
    emptyFiltered: "Geen wetten in deze fase voor dit ministerie.",
    emptyAll:
      "Op dit moment geen lopende wetsvoorstellen gevonden voor dit ministerie.",
    helpFases: "wat betekenen de fases?",
    filterAll: "Alles",
    ministerieLabel: "Ministerie",
    errorPrefix: "Kon data niet ophalen:",
    unknownError: "Onbekende fout",
    nextMoment: "Volgende moment:",
    submittedOn: "ingediend {datum}",
    dossierLabel: "dossier {n}",
  },

  wet: {
    backToMinistry: "← terug naar {naam}",
    backToOverview: "← terug naar overzicht",
    sectionWhere: "Waar bevindt het zich nu?",
    howProcess: "hoe werkt het hele proces? →",
    ekPhasePrefix: "EK-fase:",
    ekView: "bekijk op eerstekamer.nl ↗",
    sectionWhatMeans: "Wat betekent dit voor jou?",
    aiNote:
      "AI-gegenereerde samenvatting op basis van de officiële titel/onderwerp. Bekijk de tijdlijn en besluiten hieronder voor de feiten.",
    nextMoment: "Eerstvolgende moment",
    activity: "Activiteit",
    timelineTitle: "Tijdlijn van activiteiten",
    timelineEmpty: "Nog geen activiteiten geregistreerd.",
    watchExact: 'Bekijk terug: "{naam}" ↗',
    watchLikely: 'Bekijk waarschijnlijk debat: "{naam}" ↗',
    watchDay: "Bekijk de agenda van die dag op Debat Direct",
    decisionsTitle: "Besluiten en stemmingen",
    decisionsEmpty: "Nog geen besluiten genomen door de Tweede Kamer.",
    showProcedural: "Toon procedurele besluiten ({n})",
    hideProcedural: "Verberg procedurele besluiten ({n})",
    onderwerpTitle: "Volledig onderwerp",
    bronPrefix: "Bron-record:",
    fieldDossier: "dossier",
    fieldVergaderjaar: "vergaderjaar",
    fieldVoortouw: "Voortouw:",
    stilstandTitle: "Waarom ligt deze wet stil?",
    stilstandAutoNote:
      "Geen activiteit sinds {datum} (~{maanden} maanden geleden).",
    stilstandUpdated: "Laatste update van deze notitie: {datum}",
  },

  subscribe: {
    wetLabel: "Mail mij bij updates over deze wet",
    ministryLabel: "Mail mij bij updates over {naam}",
    description:
      "Je krijgt een mail bij elk nieuw event: behandeling in commissie, plenair debat, stemming (inclusief voor/tegen per fractie), en besluiten in de Eerste Kamer.",
    yourEmail: "Je e-mailadres",
    emailPlaceholder: "naam@voorbeeld.nl",
    consent:
      "Ik ga akkoord met de privacyverklaring en weet dat ik me altijd kan uitschrijven via de link in elke mail.",
    privacyLink: "privacyverklaring",
    submit: "Stuur bevestigingsmail",
    submitting: "Versturen…",
    cancel: "Annuleer",
    close: "Sluiten",
    activate:
      "Klik op de bevestigingslink in de mail om je abonnement te activeren.",
    genericError: "Kon abonnement niet versturen",
    confirmedHint: "Je bent al geabonneerd. We hebben je een herinnering gestuurd.",
  },

  stemming: {
    accepted: "Aangenomen",
    rejected: "Verworpen",
    tied: "Staken der stemmen",
    voor: "voor",
    tegen: "tegen",
    onthouden: "onthouden",
    nietDeelgenomen: "niet deelgenomen",
    hoofdelijkLabel: "Hoofdelijke stemming (elk Kamerlid stemt apart)",
    fractieLabel: "Stemming bij zitten en opstaan (per fractie)",
    mistake: "(vergissing)",
  },

  fase: {
    ingediend: "Ingediend",
    in_commissie: "In commissie",
    plenair_tk: "Plenair debat",
    stemming_tk: "Stemming Tweede Kamer",
    aangenomen_tk: "Aangenomen door TK",
    in_eerste_kamer: "In behandeling Eerste Kamer",
    aangenomen_ek: "Aangenomen door Eerste Kamer",
    wet: "Wet (Staatsblad)",
    verworpen: "Verworpen",
    ingetrokken: "Ingetrokken",
    onbekend: "Onbekend",
  },

  filterOpties: {
    in_commissie: "In commissie TK",
    plenair_tk: "Plenair / stemming TK",
    aangenomen_tk: "Aangenomen door TK",
    eerste_kamer: "In Eerste Kamer",
    wet: "Wet (Staatsblad)",
    verworpen: "Verworpen / ingetrokken",
  },

  ministeries: {
    "buitenlandse-zaken": {
      naam: "Buitenlandse Zaken",
      korteNaam: "Buitenlandse Zaken",
      beschrijving: "Diplomatie, EU-besluiten, sancties, mensenrechten.",
    },
    "justitie-en-veiligheid": {
      naam: "Justitie en Veiligheid",
      korteNaam: "Justitie en Veiligheid",
      beschrijving:
        "Strafrecht, politie, rechterlijke macht, terrorismebestrijding.",
    },
    "binnenlandse-zaken": {
      naam: "Binnenlandse Zaken en Koninkrijksrelaties",
      korteNaam: "Binnenlandse Zaken",
      beschrijving:
        "Democratie, gemeenten, overheidsorganisatie, AVG en grondrechten.",
    },
    "onderwijs-cultuur-wetenschap": {
      naam: "Onderwijs, Cultuur en Wetenschap",
      korteNaam: "Onderwijs, Cultuur en Wetenschap",
      beschrijving: "Scholen, universiteiten, cultuur, media, wetenschap.",
    },
    financien: {
      naam: "Financiën",
      korteNaam: "Financiën",
      beschrijving: "Belastingen, begroting, financiële sector, btw.",
    },
    defensie: {
      naam: "Defensie",
      korteNaam: "Defensie",
      beschrijving: "Krijgsmacht, militair personeel, internationale missies.",
    },
    "infrastructuur-en-waterstaat": {
      naam: "Infrastructuur en Waterstaat",
      korteNaam: "Infrastructuur en Waterstaat",
      beschrijving: "Wegen, OV, water, luchtvaart, milieuwetgeving.",
    },
    "economische-zaken": {
      naam: "Economische Zaken",
      korteNaam: "Economische Zaken",
      beschrijving: "Bedrijfsleven, mkb, mededinging, innovatie.",
    },
    "klimaat-en-groene-groei": {
      naam: "Klimaat en Groene Groei",
      korteNaam: "Klimaat en Groene Groei",
      beschrijving:
        "Klimaatbeleid, energie, CO₂, verduurzaming, gasvrij wonen.",
    },
    "landbouw-en-natuur": {
      naam: "Landbouw, Visserij, Voedselzekerheid en Natuur",
      korteNaam: "Landbouw, Visserij, Voedselzekerheid en Natuur",
      beschrijving: "Boeren, stikstof, voedselveiligheid, natuurbeheer.",
    },
    "sociale-zaken": {
      naam: "Sociale Zaken en Werkgelegenheid",
      korteNaam: "Sociale Zaken en Werkgelegenheid",
      beschrijving:
        "Uitkeringen, AOW, pensioenen, arbeidsrecht, kinderopvang.",
    },
    volksgezondheid: {
      naam: "Volksgezondheid, Welzijn en Sport",
      korteNaam: "Volksgezondheid, Welzijn en Sport",
      beschrijving:
        "Zorgverzekering, ziekenhuizen, ouderenzorg, jeugdzorg, sport.",
    },
    "asiel-en-migratie": {
      naam: "Asiel en Migratie",
      korteNaam: "Asiel en Migratie",
      beschrijving: "Asielprocedures, vreemdelingenrecht, opvang.",
    },
    "volkshuisvesting-en-ruimtelijke-ordening": {
      naam: "Volkshuisvesting en Ruimtelijke Ordening",
      korteNaam: "Volkshuisvesting en Ruimtelijke Ordening",
      beschrijving:
        "Woningbouw, huurregels, ruimtelijke ordening en de Omgevingswet.",
    },
    "buitenlandse-handel-en-ontwikkeling": {
      naam: "Buitenlandse Handel en Ontwikkelingssamenwerking",
      korteNaam: "Buitenlandse Handel en Ontwikkelingssamenwerking",
      beschrijving:
        "Internationale handel, ontwikkelingshulp, exportcontroles.",
    },
  },
};
