// Dictionary-interface voor i18n. Beide locales (nl.ts, en.ts) implementeren
// dezelfde structuur zodat TypeScript afdwingt dat geen key ontbreekt.
//
// Stringtemplate-conventie: gebruik `{key}` voor invoegpunten, vervang via
// .replace("{key}", waarde) op de call-site. Geen function-props in dict,
// want de dict wordt soms doorgegeven aan client components en functies
// kunnen niet de server→client boundary over zonder "use server".

export type Locale = "nl" | "en";

export interface Dictionary {
  common: {
    languageToggle: string; // toggle-knop label voor de tegenovergestelde taal
    languageCurrent: string; // label voor huidige taal (in accessible labels)
  };

  nav: {
    siteName: string; // "Wetgevings" prefix
    siteAccent: string; // "monitor" deel (accent kleur)
    ministries: string;
    process: string;
    processShort: string;
    about: string;
    contact: string;
    searchTitle: string;
    searchAria: string;
  };

  footer: {
    source: string; // "Brongegevens: Tweede Kamer Open Data (CC0)."
    notOfficial: string;
    follow: string;
    contact: string;
    blueskyAria: string;
    instagramAria: string;
  };

  home: {
    title: string;
    intro: string;
    statsRunning: string; // "{lopend} lopende wetsvoorstellen op dit moment, ..."
    lastSync: string; // "Laatst gesynchroniseerd met TK-API op {datum} ..."
    weekStripTitle: string; // "Deze week op de TK-agenda"
    weekStripWeekLabel: string; // "— week {n}"
    weekStripEmpty: string;
    weekStripNoBehandeling: string;
    weekStripCountSingular: string; // "{n} wet"
    weekStripCountPlural: string; // "{n} wetten"
    weekStripShowMore: string; // "Toon overige {aantal} debaten deze week ↓"
    weekStripShowLess: string;
    weekStripDebatDirectAria: string;
    chooseMinistry: string;
    tileRunning: string; // "lopend"
    tileTotal: string; // "{n} totaal"
    tileNext: string; // "eerstvolgend op {datum}"
    bottomDisclaimer: string;
  };

  contact: {
    title: string;
    intro: string;
    successHint: string;
    formName: string;
    formNamePlaceholder: string;
    formEmail: string;
    formEmailPlaceholder: string;
    formMessage: string;
    formMessagePlaceholder: string;
    formCharCounter: string; // "{n}/5000"
    formConsent: string;
    formSubmit: string;
    formSubmitting: string;
    formGenericError: string;
    footerNote: string;
    privacyTitle: string;
  };

  // Hieronder volgen secties voor pagina's die in vervolg-commit volledig
  // worden vertaald. Voor nu zijn keys gedefinieerd; vulling kan per locale
  // (zie en.ts) tijdelijk Nederlands blijven en stapsgewijs vertaald.

  about: {
    title: string;
    para1: string;
    para2: string;
    sourcesTitle: string;
    sourceTkLabel: string;
    sourceTkDescription: string;
    sourceKoopLabel: string;
    sourceKoopDescription: string;
    sourceWettenLabel: string;
    sourceWettenDescription: string;
    explanationTitle: string;
    explanationBody: string;
    howMinistryTitle: string;
    howMinistryBody: string;
    disclaimerTitle: string;
    disclaimerBody: string;
  };

  proces: {
    title: string;
    intro: string;
    exampleNote: string;
    stepsTitle: string;
    waarLabel: string;
    rejectedTitle: string;
    rejectedBody: string;
    enactTitle: string;
    enactBody: string;
    sourcesPrefix: string;
    sourceTk: string;
    sourceEk: string;
    stappen: Record<
      string,
      { korteNaam: string; volledigeNaam: string; uitleg: string; waar: string }
    >;
    statusTitle: string;
    statusIntro: string;
    statusColStatus: string;
    statusColMeaning: string;
    statusColFases: string;
    statusLopendLabel: string;
    statusLopendMeaning: string;
    statusLopendFases: string;
    statusAfgerondLabel: string;
    statusAfgerondMeaning: string;
    statusAfgerondFases: string;
    statusNote: string;
  };

  ministery: {
    backToAll: string;
    subscribeNote: string;
    runningTitle: string; // "Lopende wetsvoorstellen ({n})"
    completedTitle: string; // "Afgerond / verworpen ({n})"
    showMore: string; // "Toon overige {aantal} wetsvoorstellen ↓"
    showLess: string;
    emptyFiltered: string;
    emptyAll: string;
    helpFases: string;
    filterAll: string; // "Alles"
    ministerieLabel: string; // "Ministerie" header-prefix
    errorPrefix: string; // "Kon data niet ophalen:"
    unknownError: string;
    nextMoment: string; // "Volgende moment:"
    submittedOn: string; // "ingediend {datum}"
    dossierLabel: string; // "dossier {n}"
  };

  wet: {
    backToMinistry: string; // "← terug naar {naam}"
    backToOverview: string;
    sectionWhere: string;
    howProcess: string;
    ekPhasePrefix: string;
    ekView: string;
    sectionWhatMeans: string;
    aiNote: string;
    nextMoment: string;
    activity: string;
    timelineTitle: string;
    timelineEmpty: string;
    watchExact: string; // "Bekijk terug: \"{naam}\" ↗"
    watchLikely: string; // "Bekijk waarschijnlijk debat: \"{naam}\" ↗"
    watchDay: string;
    decisionsTitle: string;
    decisionsEmpty: string;
    showProcedural: string; // "Toon procedurele besluiten ({n})"
    hideProcedural: string;
    onderwerpTitle: string;
    bronPrefix: string;
    fieldDossier: string;
    fieldVergaderjaar: string;
    fieldVoortouw: string;
    stilstandTitle: string; // "Waarom ligt deze wet stil?"
    stilstandAutoNote: string; // "Geen activiteit sinds {datum} — ~{maanden} maanden"
    stilstandUpdated: string; // "Laatste update notitie: {datum}"
  };

  subscribe: {
    wetLabel: string;
    ministryLabel: string; // "Mail mij bij updates over {naam}"
    description: string;
    yourEmail: string;
    emailPlaceholder: string;
    consent: string;
    privacyLink: string;
    submit: string;
    submitting: string;
    cancel: string;
    close: string;
    activate: string;
    genericError: string;
    confirmedHint: string;
  };

  stemming: {
    accepted: string;
    rejected: string;
    tied: string;
    voor: string;
    tegen: string;
    onthouden: string;
    nietDeelgenomen: string;
    hoofdelijkLabel: string;
    fractieLabel: string;
    mistake: string;
  };

  fase: {
    ingediend: string;
    in_commissie: string;
    plenair_tk: string;
    stemming_tk: string;
    aangenomen_tk: string;
    in_eerste_kamer: string;
    aangenomen_ek: string;
    wet: string;
    verworpen: string;
    ingetrokken: string;
    onbekend: string;
  };

  filterOpties: {
    in_commissie: string;
    plenair_tk: string;
    aangenomen_tk: string;
    eerste_kamer: string;
    wet: string;
    verworpen: string;
  };

  ministeries: Record<
    string,
    { naam: string; korteNaam: string; beschrijving: string }
  >;
}
