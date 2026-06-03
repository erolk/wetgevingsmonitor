import fs from "node:fs";
import path from "node:path";

export type Bewindspersoon = {
  naam: string;
  rol: "minister" | "staatssecretaris";
  departement: string;
  partij: string;
};

export type KabinetData = {
  naam: string;
  korteNaam: string;
  startDatum: string; // ISO yyyy-mm-dd
  eindDatum: string | null;
  ministerPresident: string;
  partijen: string[];
  bewindspersonen: Bewindspersoon[];
};

export type Kabinet = KabinetData & { slug: string };

function load(): Record<string, KabinetData> {
  try {
    const p = path.join(process.cwd(), "data", "kabinetten.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, KabinetData>;
  } catch {
    return {};
  }
}

export function alleKabinetten(): Kabinet[] {
  const all = load();
  return Object.entries(all).map(([slug, k]) => ({ ...k, slug }));
}

export function getKabinet(slug: string): Kabinet | null {
  const all = load();
  const k = all[slug];
  return k ? { ...k, slug } : null;
}

export function bewindspersoonNamen(k: Kabinet): string[] {
  return k.bewindspersonen.map((b) => b.naam);
}

export function bewindspersoonViaNaam(
  k: Kabinet,
  actorNaam: string,
): Bewindspersoon | null {
  return k.bewindspersonen.find((b) => b.naam === actorNaam) ?? null;
}
