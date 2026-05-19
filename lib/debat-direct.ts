// Koppelt een TK-activiteit aan een Debat Direct video via de publieke API
// (api.debatdirect.tweedekamer.nl/agenda/YYYY-MM-DD). Geen authenticatie nodig.
// Match-strategie: per datum één agenda ophalen, dan fuzzy-matchen op naam.

const API_BASE = "https://api.debatdirect.tweedekamer.nl";
const SITE_BASE = "https://debatdirect.tweedekamer.nl";

type DebatDirectItem = {
  id: string;
  name: string;
  slug: string;
  debateType: string;
  startsAt: string;
  endsAt: string;
  locationName: string;
  locationId: string;
  debateDate: string;
  categoryNames: string[];
  categoryIds: string[];
};

export type DebatMatch = {
  url: string;
  naam: string;
  startsAt: string;
  endsAt: string;
  zekerheid: "exact" | "waarschijnlijk" | "dag";
};

const VIDEO_SOORTEN_SUBSTRINGS = [
  "plenair",
  "debat",
  "commissiedebat",
  "wetgevingsoverleg",
  "tweeminutendebat",
  "notaoverleg",
  "rondetafelgesprek",
  "hoorzitting",
];

export function heeftMogelijkVideo(soort: string | null | undefined): boolean {
  if (!soort) return false;
  const s = soort.toLowerCase();
  if (
    s.includes("inbreng") ||
    s.includes("procedurevergadering") ||
    s.includes("emailprocedure") ||
    s.includes("verslag") ||
    s.includes("besluit") ||
    s.includes("toezending")
  ) {
    return false;
  }
  return VIDEO_SOORTEN_SUBSTRINGS.some((v) => s.includes(v));
}

const STOPWOORDEN = new Set([
  "over",
  "voor",
  "voorstel",
  "voorstellen",
  "wet",
  "wijziging",
  "wijzigen",
  "instellen",
  "instelling",
  "regels",
  "gebied",
  "kader",
  "betreft",
  "betreffende",
  "naar",
  "aanleiding",
  "tweeminutendebat",
  "behandeling",
  "verband",
  "introductie",
  "aanscherpen",
  "vereisten",
  "deze",
  "tijdens",
  "vergadering",
  "kamer",
  "tweede",
  "eerste",
  "vraag",
  "vragen",
  "ministerie",
  "minister",
  "staatssecretaris",
]);

function keywords(tekst: string | null | undefined): string[] {
  if (!tekst) return [];
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 5 && !STOPWOORDEN.has(w));
}

async function fetchAgenda(datum: string): Promise<DebatDirectItem[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const isToekomstOfVandaag = datum >= today;
    const res = await fetch(`${API_BASE}/agenda/${datum}`, {
      // Verleden datums veranderen niet → lang cachen. Vandaag/toekomst korter.
      next: {
        revalidate: isToekomstOfVandaag ? 60 * 30 : 60 * 60 * 24 * 7,
      },
    });
    if (!res.ok) return [];
    const d = (await res.json()) as { debates?: DebatDirectItem[] };
    return d.debates ?? [];
  } catch {
    return [];
  }
}

function bouwUrl(d: DebatDirectItem): string {
  const cat = d.categoryIds?.[0] ?? "overig";
  return `${SITE_BASE}/${d.debateDate}/${cat}/${d.locationId}/${d.slug}/onderwerp`;
}

export async function findDebatVoorActiviteit(
  datum: string,
  onderwerp: string | null,
  soort: string | null,
): Promise<DebatMatch | null> {
  if (!heeftMogelijkVideo(soort)) return null;
  const dateOnly = datum.slice(0, 10);
  const nu = new Date().toISOString().slice(0, 10);
  if (dateOnly > nu) return null; // toekomst → nog geen video

  const debates = await fetchAgenda(dateOnly);
  if (debates.length === 0) return null;

  const woorden = keywords(onderwerp);
  if (woorden.length === 0) {
    // Geen woorden om op te matchen — bied dag-link aan
    return {
      url: `${SITE_BASE}/${dateOnly}`,
      naam: "Agenda van die dag",
      startsAt: dateOnly,
      endsAt: dateOnly,
      zekerheid: "dag",
    };
  }

  let best: { score: number; debate: DebatDirectItem } | null = null;
  for (const d of debates) {
    const haystack = `${d.name} ${d.slug ?? ""}`.toLowerCase();
    const score = woorden.reduce(
      (acc, w) => acc + (haystack.includes(w) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { score, debate: d };
    }
  }

  if (!best) {
    // Geen match, maar wel debaten op die dag — link naar dag-overzicht
    return {
      url: `${SITE_BASE}/${dateOnly}`,
      naam: "Agenda van die dag",
      startsAt: dateOnly,
      endsAt: dateOnly,
      zekerheid: "dag",
    };
  }

  const d = best.debate;
  return {
    url: bouwUrl(d),
    naam: d.name,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    zekerheid: best.score >= 2 ? "exact" : "waarschijnlijk",
  };
}
