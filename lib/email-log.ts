import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

// Lichtgewicht verzendlog voor e-mails (data/email-log.json). Bewaart de laatste
// ~200 verzendpogingen met resultaat, zodat het admin-panel kan tonen of mails
// succesvol zijn verzonden. E-mailadressen worden gemaskeerd opgeslagen.

export type EmailLogEntry = {
  at: string; // ISO
  to: string; // gemaskeerd
  subject: string;
  ok: boolean;
  via: string;
  detail?: string;
};

const FILE = path.join(process.cwd(), "data", "email-log.json");
const MAX = 200;

export function maskEmail(adres: string): string {
  const [lokaal, domein] = adres.split("@");
  if (!domein) return "***";
  const l =
    lokaal.length <= 2
      ? `${lokaal[0] ?? "*"}*`
      : `${lokaal[0]}***${lokaal[lokaal.length - 1]}`;
  return `${l}@${domein}`;
}

export async function logEmail(entry: Omit<EmailLogEntry, "at">): Promise<void> {
  try {
    let lijst: EmailLogEntry[] = [];
    try {
      lijst = JSON.parse(await fs.readFile(FILE, "utf8"));
    } catch {
      lijst = [];
    }
    lijst.push({ at: new Date().toISOString(), ...entry });
    if (lijst.length > MAX) lijst = lijst.slice(-MAX);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(lijst, null, 2));
  } catch {
    // Loggen mag de mail-flow nooit breken.
  }
}

export type EmailLogOverzicht = {
  entries: EmailLogEntry[];
  totaal: number;
  ok: number;
  fout: number;
  laatste: string | null;
};

export function getEmailLog(limit = 15): EmailLogOverzicht {
  try {
    const lijst: EmailLogEntry[] = JSON.parse(fssync.readFileSync(FILE, "utf8"));
    const ok = lijst.filter((e) => e.ok).length;
    return {
      entries: [...lijst].slice(-limit).reverse(),
      totaal: lijst.length,
      ok,
      fout: lijst.length - ok,
      laatste: lijst.length ? lijst[lijst.length - 1].at : null,
    };
  } catch {
    return { entries: [], totaal: 0, ok: 0, fout: 0, laatste: null };
  }
}
