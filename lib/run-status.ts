import fs from "node:fs";
import path from "node:path";

// Run-status van de losse scripts (data/status.json). De scripts schrijven hier
// na elke run hun resultaat naartoe; het admin-panel leest het terug. Lokaal/op
// een host met schijf werkt dit; op een read-only host blijft het leeg.

export type RunStatus = {
  ok: boolean;
  lastRun: string; // ISO
  message?: string;
  aantal?: number;
  duurMs?: number;
};

export function getRunStatus(): Record<string, RunStatus> {
  try {
    const p = path.join(process.cwd(), "data", "status.json");
    return JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, RunStatus>;
  } catch {
    return {};
  }
}
