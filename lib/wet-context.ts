// Handmatig geschreven context per wetsvoorstel. Gebruikt voor wetten die
// langere tijd stilstaan en waar een politieke duiding helpt. Geen
// AI-generatie — feitelijk, kort, controleerbaar.

import fs from "node:fs";
import path from "node:path";

export type WetContext = {
  /** Korte één-zin samenvatting (optioneel — vervangt geen burger-uitleg). */
  samenvatting?: string;
  /** Uitleg waarom de wet stilstaat of bijzondere context heeft. */
  waarom: string;
  /** Datum waarop deze notitie laatst is bijgewerkt (YYYY-MM-DD). */
  laatsteUpdate: string;
};

function load(): Record<string, WetContext> {
  const p = path.join(process.cwd(), "data", "wet-context.json");
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

export function getWetContext(tkId: string): WetContext | null {
  return load()[tkId] ?? null;
}
