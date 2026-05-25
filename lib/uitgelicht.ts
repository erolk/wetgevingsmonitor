import fs from "node:fs";
import path from "node:path";
import type { WetVoorstel } from "./types";
import { getAlleUitleg, type Uitleg } from "./explanations";

// "Uitgelicht: wat merkt u ervan?" — kies één lopende wet die de burger direct
// raakt in de portemonnee of de leefomgeving. We genereren GEEN nieuwe tekst:
// we hergebruiken de al-gecontroleerde burger-uitleg (raaktJou). Alleen de
// SELECTIE (welke wet + welke categorie) gebeurt hier, op basis van trefwoorden.

export type Categorie = "portemonnee" | "leefomgeving";

const TREFWOORDEN: Record<Categorie, string[]> = {
  portemonnee: [
    "huur", "belasting", "toeslag", "btw", "accijns", "energie", "zorgpremie",
    "zorgverzekering", "eigen risico", "pensioen", "aow", "minimumloon",
    "hypotheek", "koopkracht", "heffing", "subsidie", "inkomen", "loon",
    "uitkering", "studiefinanciering", "kinderopvang", "schuld", "boete",
    "tarief", "premie",
  ],
  leefomgeving: [
    "woning", "woningbouw", "huisvesting", "natuur", "stikstof", "milieu",
    "klimaat", "omgevingswet", "ruimtelijke ordening", "water", "geluid",
    "luchtkwaliteit", "openbaar vervoer", "verkeer", "bouw", "energietransitie",
    "warmte", "windenergie", "zonne", "leefomgeving", "wonen", "gebied",
  ],
};

/** Bepaal de categorie op basis van titel + onderwerp + uitleg-tekst. */
export function categoriseer(tekst: string): Categorie | null {
  const t = tekst.toLowerCase();
  const scores: Record<Categorie, number> = { portemonnee: 0, leefomgeving: 0 };
  (Object.keys(TREFWOORDEN) as Categorie[]).forEach((c) => {
    scores[c] = TREFWOORDEN[c].reduce(
      (acc, w) => acc + (t.includes(w) ? 1 : 0),
      0,
    );
  });
  if (scores.portemonnee === 0 && scores.leefomgeving === 0) return null;
  return scores.leefomgeving > scores.portemonnee
    ? "leefomgeving"
    : "portemonnee";
}

export type Uitgelicht = {
  wet: WetVoorstel;
  categorie: Categorie;
  uitleg: Uitleg;
  /** ISO-datum: gezet als deze wet deze week op de TK-agenda staat. */
  agendaDatum?: string;
};

// Optionele handmatige keuze: pin een wet vast in data/uitgelicht.json. Zo houdt
// de maker controle over deze gevoelige "raakt u"-plek wanneer gewenst; staat
// het bestand er niet, dan kiest de site automatisch.
type Pin = { wetId?: string; categorie?: Categorie };

function leesPin(): Pin | null {
  try {
    const p = path.join(process.cwd(), "data", "uitgelicht.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as Pin;
  } catch {
    return null;
  }
}

/**
 * Kies de uitgelichte wet uit de lopende wetten. Voorkeur:
 *   1. een handmatig vastgepinde wet (indien nog lopend);
 *   2. een wet die deze week op de TK-agenda staat (vroegste datum eerst);
 *   3. een wet met een aankomende activiteit (eerstvolgende datum);
 *   4. anders de meest recent gestarte passende wet.
 * `dezeWeek` is een map van wet-id → vroegste agendadatum deze week.
 * Een wet komt alleen in aanmerking als er een gecontroleerde uitleg bestaat
 * én de titel/onderwerp/uitleg in een categorie valt.
 */
export function kiesUitgelicht(
  lopend: WetVoorstel[],
  dezeWeek?: Map<string, string>,
): Uitgelicht | null {
  const alleUitleg = getAlleUitleg();
  const pin = leesPin();

  const kandidaten: Uitgelicht[] = [];
  for (const wet of lopend) {
    const uitleg = alleUitleg[wet.id];
    if (!uitleg) continue;
    const categorie =
      pin?.wetId === wet.id && pin.categorie
        ? pin.categorie
        : categoriseer(`${wet.titel} ${wet.onderwerp} ${uitleg.watRegelt}`);
    if (!categorie) continue;
    kandidaten.push({ wet, categorie, uitleg });
  }

  if (kandidaten.length === 0) return null;

  // 1. handmatige pin (override) — toon eventueel de agendadatum erbij.
  if (pin?.wetId) {
    const gepind = kandidaten.find((k) => k.wet.id === pin.wetId);
    if (gepind) return { ...gepind, agendaDatum: dezeWeek?.get(gepind.wet.id) };
  }

  // 2. staat deze week op de TK-agenda (vroegste datum eerst).
  if (dezeWeek && dezeWeek.size > 0) {
    const dezeWeekKandidaten = kandidaten
      .filter((k) => dezeWeek.has(k.wet.id))
      .sort(
        (a, b) =>
          new Date(dezeWeek.get(a.wet.id)!).getTime() -
          new Date(dezeWeek.get(b.wet.id)!).getTime(),
      );
    if (dezeWeekKandidaten.length > 0) {
      const beste = dezeWeekKandidaten[0];
      return { ...beste, agendaDatum: dezeWeek.get(beste.wet.id) };
    }
  }

  // 3. heeft een aankomende activiteit.
  const nu = Date.now();
  const metAankomendeDatum = kandidaten
    .filter((k) => {
      const d = k.wet.volgendeActiviteit?.datum;
      return d != null && new Date(d).getTime() >= nu;
    })
    .sort(
      (a, b) =>
        new Date(a.wet.volgendeActiviteit!.datum!).getTime() -
        new Date(b.wet.volgendeActiviteit!.datum!).getTime(),
    );
  if (metAankomendeDatum.length > 0) return metAankomendeDatum[0];

  // 4. fallback: meest recent gestart.
  return [...kandidaten].sort((a, b) => {
    const da = a.wet.gestartOp ? new Date(a.wet.gestartOp).getTime() : 0;
    const db = b.wet.gestartOp ? new Date(b.wet.gestartOp).getTime() : 0;
    return db - da;
  })[0];
}
