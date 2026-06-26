import fs from "node:fs";
import path from "node:path";

// Leest de gegenereerde audit-rapportage (data/audit-wetgeving.json).
// Wordt geproduceerd door scripts/audit-wetgeving.mjs en automatisch
// bijgewerkt door de wekelijkse maandag-Action.

export type AuditWet = {
  id: string;
  nummer: string;
  titel: string;
  korteNaam: string | null;
  gestartOp: string | null;
  reden?: string;
};

export type AuditRapport = {
  bijgewerkt: string;
  totaalTk: number;
  lopendTk: number;
  opMonitor: number;
  dekking: number; // percentage (1 decimaal)
  missend: { geenVoortouw: number; andereCommissie: number };
  andereCommissies: { naam: string; aantal: number }[];
  mismatchesAantal: number;
  mismatches: AuditWet[];
  missendeWetten: AuditWet[];
};

export function getAuditRapport(): AuditRapport | null {
  try {
    const p = path.join(process.cwd(), "data", "audit-wetgeving.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as AuditRapport;
  } catch {
    return null;
  }
}
