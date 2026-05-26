import type { Dictionary } from "./types";

export const en: Dictionary = {
  common: {
    languageToggle: "NL",
    languageCurrent: "English",
  },

  nav: {
    siteName: "Legislation ",
    siteAccent: "monitor",
    ministries: "Ministries",
    migratiepact: "Migration Pact",
    process: "How does it work?",
    processShort: "Process",
    about: "About",
    contact: "Contact",
    searchTitle: "Search",
    searchAria: "Search all bills",
  },

  footer: {
    source: "Source data: House of Representatives Open Data (CC0).",
    notOfficial: "This website is not an official website of the Dutch government.",
    follow: "Follow us:",
    contact: "Contact",
    blueskyAria: "Legislation Monitor on Bluesky",
    instagramAria: "Legislation Monitor on Instagram",
  },

  home: {
    title: "Which Dutch bills are currently being drafted and debated?",
    intro:
      "Per ministry you see which bills are in progress, where they stand in the process, and when they are scheduled for debate or vote. Direct from the open data of the Dutch House of Representatives.",
    statsRunning:
      "bills currently in progress, {totaal} in total being handled or recently completed.",
    lastSync:
      "Last synchronised with the TK API at {datum} · refreshes automatically every 24 hours (bill detail pages every 6 hours)",
    weekStripTitle: "This week on the House agenda",
    weekStripWeekLabel: "— week {n}",
    weekStripEmpty: "No bills on the House of Representatives agenda this week.",
    weekStripNoBehandeling: "no handling",
    weekStripCountSingular: "{n} bill",
    weekStripCountPlural: "{n} bills",
    weekStripShowMore: "Show {aantal} more debates this week ↓",
    weekStripShowLess: "Show less ↑",
    weekStripDebatDirectAria: "Watch debate on Debat Direct",
    uitgelichtEyebrow: "Featured",
    uitgelichtPortemonnee: "Your wallet",
    uitgelichtLeefomgeving: "Your environment",
    uitgelichtKopPortemonnee: "What this could mean for your wallet",
    uitgelichtKopLeefomgeving: "What this could mean for your living environment",
    uitgelichtNext: "next step on {datum}",
    uitgelichtDezeWeek: "On the agenda this week · {datum}",
    uitgelichtLeesMeer: "Read what this bill means →",
    chooseMinistry: "Choose a ministry",
    tileRunning: "in progress",
    tileTotal: "{n} total",
    tileNext: "next event on {datum}",
    bottomDisclaimer:
      "Source data: House of Representatives Open Data (CC0). Plain-language summaries per bill are AI-generated based on the official title and subject. This website is not an official website of the Dutch government.",
  },

  contact: {
    title: "Contact",
    intro:
      "Question, comment, typo or an idea for improvement? Send it below. Messages go directly to the maintainer — no mailing list, no auto-reply.",
    successHint:
      "We usually respond within a few days to the email address you provided.",
    formName: "Name",
    formNamePlaceholder: "Your name",
    formEmail: "Email address",
    formEmailPlaceholder: "name@example.com",
    formMessage: "Comments / question",
    formMessagePlaceholder:
      "Question, comment, suggestion or typo? Let us know.",
    formCharCounter: "{n}/5000",
    formConsent:
      "I would like my name and email address to be used only so I can be replied to, and not shared further.",
    formSubmit: "Send message",
    formSubmitting: "Sending…",
    formGenericError: "Could not send message",
    footerNote:
      "We only use your details to respond. Messages are not forwarded, published or shared with third parties.",
    privacyTitle:
      "For substantive questions about bills themselves: always check tweedekamer.nl or eerstekamer.nl.",
  },

  about: {
    title: "About this site",
    para1:
      "Legislation Monitor shows which bills are currently on the table in The Hague, per ministry. For each bill you see where it stands in the process, what the next scheduled activity is (debate, vote, committee handling), and — in plain language — what it means for an ordinary citizen.",
    para2:
      "The site is independent, non-commercial, and has no ties with the Dutch government or any political party. Its goal: to show that politics is in fact actively working on legislation, not just meetings.",
    sourcesTitle: "Data sources",
    sourceTkLabel: "House of Representatives Open Data",
    sourceTkDescription:
      "OData v4 API, base endpoint {endpoint}. Licence: CC0.",
    sourceKoopLabel: "KOOP / officielebekendmakingen.nl",
    sourceKoopDescription:
      "source for the official Bulletin (Staatsblad) and parliamentary documents (future extension).",
    sourceWettenLabel: "wetten.overheid.nl",
    sourceWettenDescription:
      "the binding legal text once a bill becomes law.",
    explanationTitle: "Plain-language summaries",
    explanationBody:
      "Each bill has a short summary in plain language. This is automatically generated using AI (Claude) based on the official title and subject from the House of Representatives source. The summary is meant as an aid to understanding — for legal details always consult the official documents.",
    howMinistryTitle: 'How is "ministry" determined?',
    howMinistryBody:
      "The House of Representatives records for each case which standing committee is in the lead. Each standing committee corresponds to one ministry. We group bills by that lead committee.",
    disclaimerTitle: "Disclaimer",
    disclaimerBody:
      "Although the source data is open and reliable, there may be delay or a rendering error. For any decision-making, always consult the official source. This website is not an official website of the Dutch government.",
  },

  proces: {
    title: "How is a Dutch law made?",
    intro:
      'A bill goes through eight steps before it actually becomes a "law". Some steps take weeks, others months or years. For every bill on this site you see which step it is currently in.',
    exampleNote:
      "Example: a bill currently in a plenary debate in the House of Representatives. Completed steps have a checkmark, the current step pulses red, future steps are open circles.",
    stepsTitle: "The eight steps",
    waarLabel: "where:",
    rejectedTitle: "What if a bill is rejected?",
    rejectedBody:
      "If the House of Representatives or Senate rejects a bill, the process stops. The minister can submit a new, amended bill — then the process restarts at step 1. A minister can also withdraw a bill before a vote, for example if it is clear there is no majority.",
    enactTitle: "When does a law take effect?",
    enactBody:
      "Royal assent by the King and publication in the official Bulletin (Staatsblad) formally turn the bill into law. The actual entry into force often happens later — usually on a fixed date (1 January or 1 July), or once the implementing organisation is ready. Sometimes the entry-into-force date is in the law itself, sometimes it is set later by royal decree.",
    sourcesPrefix: "Source and background:",
    sourceTk: "tweedekamer.nl — How a law comes into being",
    sourceEk: "eerstekamer.nl — Legislation",
    stappen: {
      ministerie: {
        korteNaam: "Ministry",
        volledigeNaam: "Drafting at the ministry",
        uitleg:
          "The ministry drafts the bill. Often after a public internet consultation in which citizens and organisations can respond.",
        waar: "Ministry",
      },
      rvs: {
        korteNaam: "Council of State",
        volledigeNaam: "Advice from the Council of State",
        uitleg:
          "The Council of State gives mandatory advice on every bill. This advice is not binding, but the cabinet must weigh it seriously and respond publicly.",
        waar: "Council of State",
      },
      tk_ingediend: {
        korteNaam: "Submitted (House)",
        volledigeNaam: "Submitted to House of Representatives",
        uitleg:
          "The King formally sends the bill to the House of Representatives. From this moment on it is public.",
        waar: "House of Representatives",
      },
      tk_commissie: {
        korteNaam: "House committee",
        volledigeNaam: "Handled in House committee",
        uitleg:
          "The standing committee for the relevant subject (e.g. Housing) studies the bill. Written rounds follow: members ask questions, the minister responds. Sometimes hearings as well.",
        waar: "House of Representatives",
      },
      tk_plenair: {
        korteNaam: "Plenary debate",
        volledigeNaam: "Plenary debate in the House",
        uitleg:
          "The debate in the plenary chamber. Members table amendments and motions. Sometimes this takes the form of a legislative meeting (wetgevingsoverleg) or note debate.",
        waar: "House of Representatives",
      },
      tk_stemming: {
        korteNaam: "Vote (House)",
        volledigeNaam: "Vote in the House of Representatives",
        uitleg:
          "The House votes. First on amendments, then on the bill as a whole. With sufficient majority → on to the Senate. A hammer item (hamerstuk) means passed without a vote.",
        waar: "House of Representatives",
      },
      ek: {
        korteNaam: "Senate",
        volledigeNaam: "Senate handling and vote",
        uitleg:
          "The Senate reviews the bill on enforceability and legal quality. No further amendments — only yes or no. Rejection is rare but happens.",
        waar: "Senate",
      },
      wet: {
        korteNaam: "Law",
        volledigeNaam: "Royal assent and publication",
        uitleg:
          "The King and the minister sign (royal assent). The law is published in the official Bulletin (Staatsblad) and enters into force on an agreed date — often 1 January or 1 July.",
        waar: "King + Bulletin",
      },
    },
    statusTitle: "In progress or completed?",
    statusIntro:
      "On the ministry pages we split bills into two groups, based on the phase they are in:",
    statusColStatus: "Status",
    statusColMeaning: "What it means",
    statusColFases: "Phases included",
    statusLopendLabel: "In progress",
    statusLopendMeaning:
      "Still being handled — it can still be debated, voted on or decided.",
    statusLopendFases:
      "Submitted · In House committee · Plenary debate · House vote · Pending in Senate",
    statusAfgerondLabel: "Completed",
    statusAfgerondMeaning:
      "Decision-making is done — both chambers have decided, or the bill has stopped.",
    statusAfgerondFases:
      "Passed by Senate · Law (in Bulletin) · Rejected · Withdrawn",
    statusNote:
      "Note: 'Passed by the House of Representatives' does not yet mean completed. The Senate still has to handle and vote on the bill — which is why such a bill counts as in progress.",
  },

  ministery: {
    backToAll: "← all ministries",
    subscribeNote:
      "Email me about every debate, vote or decision on a bill from this ministry.",
    runningTitle: "Bills in progress",
    completedTitle: "Completed / rejected",
    showMore: "Show {aantal} more bills ↓",
    showLess: "Show less ↑",
    emptyFiltered: "No bills in this phase for this ministry.",
    emptyAll: "Currently no active bills found for this ministry.",
    helpFases: "what do the phases mean?",
    filterAll: "All",
    ministerieLabel: "Ministry",
    errorPrefix: "Could not load data:",
    unknownError: "Unknown error",
    nextMoment: "Next moment:",
    submittedOn: "submitted {datum}",
    dossierLabel: "dossier {n}",
  },

  wet: {
    backToMinistry: "← back to {naam}",
    backToOverview: "← back to overview",
    sectionWhere: "Where is it now?",
    howProcess: "how does the whole process work? →",
    ekPhasePrefix: "Senate phase:",
    ekView: "view on eerstekamer.nl ↗",
    sectionWhatMeans: "What does this mean for you?",
    aiNote:
      "AI-generated summary based on the official title/subject. See the timeline and decisions below for the facts.",
    nextMoment: "Next moment",
    activity: "Activity",
    timelineTitle: "Activity timeline",
    timelineEmpty: "No activities recorded yet.",
    timelineIndiening: "Bill submitted to the House of Representatives",
    watchExact: 'Watch back: "{naam}" ↗',
    watchLikely: 'Likely debate: "{naam}" ↗',
    watchDay: "View the agenda of that day on Debat Direct",
    decisionsTitle: "Decisions and votes",
    decisionsEmpty: "No decisions taken by the House of Representatives yet.",
    showProcedural: "Show procedural decisions ({n})",
    hideProcedural: "Hide procedural decisions ({n})",
    onderwerpTitle: "Full subject",
    bronPrefix: "Source record:",
    fieldDossier: "dossier",
    fieldVergaderjaar: "parliamentary year",
    fieldVoortouw: "Lead:",
    stilstandTitle: "Why is this bill stuck?",
    stilstandAutoNote:
      "No activity since {datum} (~{maanden} months ago).",
    stilstandUpdated: "Note last updated: {datum}",
  },

  subscribe: {
    wetLabel: "Email me about updates on this bill",
    ministryLabel: "Email me about updates on {naam}",
    description:
      "You will get an email for every new event: committee handling, plenary debate, vote (including for/against per party), and decisions in the Senate.",
    yourEmail: "Your email address",
    emailPlaceholder: "name@example.com",
    consent:
      "I agree with the privacy statement and know that I can always unsubscribe via the link in every email.",
    privacyLink: "privacy statement",
    submit: "Send confirmation email",
    submitting: "Sending…",
    cancel: "Cancel",
    close: "Close",
    activate:
      "Click the confirmation link in the email to activate your subscription.",
    genericError: "Could not send subscription",
    confirmedHint: "You are already subscribed. We have sent you a reminder.",
  },

  stemming: {
    accepted: "Accepted",
    rejected: "Rejected",
    tied: "Tied vote",
    voor: "in favour",
    tegen: "against",
    onthouden: "abstained",
    nietDeelgenomen: "did not participate",
    hoofdelijkLabel:
      "Roll-call vote (each Member votes individually)",
    fractieLabel: "Show of hands vote (per party)",
    mistake: "(mistake)",
  },

  fase: {
    ingediend: "Submitted",
    in_commissie: "In committee",
    plenair_tk: "Plenary debate",
    stemming_tk: "Vote (House)",
    aangenomen_tk: "Passed by House",
    in_eerste_kamer: "Pending in Senate",
    aangenomen_ek: "Passed by Senate",
    wet: "Law (Bulletin)",
    verworpen: "Rejected",
    ingetrokken: "Withdrawn",
    onbekend: "Unknown",
  },

  filterOpties: {
    in_commissie: "In House committee",
    plenair_tk: "Plenary / vote (House)",
    aangenomen_tk: "Passed by House",
    eerste_kamer: "In Senate",
    wet: "Law (Bulletin)",
    verworpen: "Rejected / withdrawn",
  },

  ministeries: {
    "buitenlandse-zaken": {
      naam: "Foreign Affairs",
      korteNaam: "Foreign Affairs",
      beschrijving: "Diplomacy, EU decisions, sanctions, human rights.",
    },
    "justitie-en-veiligheid": {
      naam: "Justice and Security",
      korteNaam: "Justice and Security",
      beschrijving:
        "Criminal law, police, judiciary, counter-terrorism.",
    },
    "binnenlandse-zaken": {
      naam: "Interior and Kingdom Relations",
      korteNaam: "Interior",
      beschrijving:
        "Democracy, municipalities, government organisation, GDPR and fundamental rights.",
    },
    "onderwijs-cultuur-wetenschap": {
      naam: "Education, Culture and Science",
      korteNaam: "Education, Culture and Science",
      beschrijving: "Schools, universities, culture, media, science.",
    },
    financien: {
      naam: "Finance",
      korteNaam: "Finance",
      beschrijving: "Taxes, budget, financial sector, VAT.",
    },
    defensie: {
      naam: "Defence",
      korteNaam: "Defence",
      beschrijving:
        "Armed forces, military personnel, international missions.",
    },
    "infrastructuur-en-waterstaat": {
      naam: "Infrastructure and Water Management",
      korteNaam: "Infrastructure and Water Management",
      beschrijving:
        "Roads, public transport, water, aviation, environmental law.",
    },
    "economische-zaken": {
      naam: "Economic Affairs",
      korteNaam: "Economic Affairs",
      beschrijving: "Business, SMEs, competition, innovation.",
    },
    "klimaat-en-groene-groei": {
      naam: "Climate and Green Growth",
      korteNaam: "Climate and Green Growth",
      beschrijving:
        "Climate policy, energy, CO₂, sustainability, gas-free housing.",
    },
    "landbouw-en-natuur": {
      naam: "Agriculture, Fisheries, Food Security and Nature",
      korteNaam: "Agriculture, Fisheries, Food Security and Nature",
      beschrijving:
        "Farmers, nitrogen, food safety, nature management.",
    },
    "sociale-zaken": {
      naam: "Social Affairs and Employment",
      korteNaam: "Social Affairs and Employment",
      beschrijving:
        "Benefits, state pension, pensions, labour law, childcare.",
    },
    volksgezondheid: {
      naam: "Health, Welfare and Sport",
      korteNaam: "Health, Welfare and Sport",
      beschrijving:
        "Health insurance, hospitals, elderly care, youth care, sport.",
    },
    "asiel-en-migratie": {
      naam: "Asylum and Migration",
      korteNaam: "Asylum and Migration",
      beschrijving: "Asylum procedures, immigration law, reception.",
    },
    "volkshuisvesting-en-ruimtelijke-ordening": {
      naam: "Housing and Spatial Planning",
      korteNaam: "Housing and Spatial Planning",
      beschrijving:
        "Construction, rent rules, spatial planning and the Environment Act.",
    },
    "buitenlandse-handel-en-ontwikkeling": {
      naam: "Foreign Trade and Development Cooperation",
      korteNaam: "Foreign Trade and Development Cooperation",
      beschrijving:
        "International trade, development aid, export controls.",
    },
  },
};
