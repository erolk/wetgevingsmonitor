import fs from "node:fs";
import path from "node:path";
import type { Fase } from "./types";

export type EkStatus = {
  dossiernummer: number;
  ekUrl?: string;
  gevonden: boolean;
  fase?: Fase;
  label?: string;
  blokken?: Array<"vol" | "geblokt" | "leeg" | null>;
  /** Fase-labels per blok (bv. "Ingetrokken", "Verworpen", "Afkondiging"). */
  blokLabels?: Array<string | null>;
  gegenereerdOp: string;
};

function load(): Record<string, EkStatus> {
  const p = path.join(process.cwd(), "data", "ek-status.json");
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

export function getEkStatus(tkId: string): EkStatus | null {
  const map = load();
  return map[tkId] ?? null;
}
