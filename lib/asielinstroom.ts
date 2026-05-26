import fs from "node:fs";
import path from "node:path";

// Leest de gescrapete wekelijkse asielinstroom (data/asielinstroom-week.json).
// Bron: wekelijkse Rijksoverheid-nieuwsberichten (afgeronde cijfers, HTML-scrape).
// Zie scripts/fetch-asielinstroom.mjs.

export type InstroomWeek = {
  jaar: number;
  week: number;
  datum: string; // ISO-datum van het bericht
  aantal: number;
};

export type InstroomWeekData = {
  bijgewerkt: string;
  jaar: number;
  bron: string;
  weken: InstroomWeek[];
};

export function getWeekInstroom(): InstroomWeekData | null {
  try {
    const p = path.join(process.cwd(), "data", "asielinstroom-week.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as InstroomWeekData;
  } catch {
    return null;
  }
}
