import fs from "node:fs";
import path from "node:path";

export type Uitleg = {
  /** 1-2 zinnen: wat regelt deze wet? */
  watRegelt: string;
  /** 1-2 zinnen: hoe raakt dit een gewone burger? */
  raaktJou: string;
  /** Voor wie is dit het meest relevant? */
  voorWie?: string[];
  /** Hash van de bron-tekst zodat we kunnen detecteren of een hergegenereerd moet worden. */
  bronHash: string;
  /** Wanneer gegenereerd. */
  gegenereerdOp: string;
};

// Klein bestand (~100KB max), telkens opnieuw lezen is goedkoper dan een
// stale cache die in dev/prod-builds onverwacht gedrag oplevert.
function load(): Record<string, Uitleg> {
  const p = path.join(process.cwd(), "data", "explanations.json");
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getUitleg(wetId: string): Uitleg | null {
  const map = load();
  return map[wetId] ?? null;
}

/** Volledige uitleg-map (voor wie meerdere wetten tegelijk verwerkt). */
export function getAlleUitleg(): Record<string, Uitleg> {
  return load();
}
