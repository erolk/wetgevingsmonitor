import fs from "node:fs/promises";
import path from "node:path";

// Schrijft de uitkomst van een script-run naar data/status.json zodat het
// admin-panel kan tonen of het ophalen/bijwerken is gelukt. Faalt stil — het
// loggen mag de eigenlijke taak nooit breken.
export async function schrijfRunStatus(root, job, velden) {
  try {
    const p = path.join(root, "data", "status.json");
    let alles = {};
    try {
      alles = JSON.parse(await fs.readFile(p, "utf8"));
    } catch {}
    alles[job] = { lastRun: new Date().toISOString(), ...velden };
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(alles, null, 2));
  } catch (e) {
    console.error("run-status schrijven mislukt:", e.message);
  }
}

// Voegt een verzendpoging toe aan data/email-log.json (laatste ~200), met
// gemaskeerd e-mailadres. Gebruikt door check-updates.mjs.
export async function logEmailPoging(root, entry) {
  try {
    const p = path.join(root, "data", "email-log.json");
    let lijst = [];
    try {
      lijst = JSON.parse(await fs.readFile(p, "utf8"));
    } catch {}
    lijst.push({ at: new Date().toISOString(), ...entry });
    if (lijst.length > 200) lijst = lijst.slice(-200);
    await fs.mkdir(path.dirname(p), { recursive: true });
    await fs.writeFile(p, JSON.stringify(lijst, null, 2));
  } catch (e) {
    console.error("email-log schrijven mislukt:", e.message);
  }
}

export function maskEmail(adres) {
  const [lokaal, domein] = String(adres).split("@");
  if (!domein) return "***";
  const l =
    lokaal.length <= 2
      ? `${lokaal[0] ?? "*"}*`
      : `${lokaal[0]}***${lokaal[lokaal.length - 1]}`;
  return `${l}@${domein}`;
}
