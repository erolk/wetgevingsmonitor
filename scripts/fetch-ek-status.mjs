#!/usr/bin/env node
// Haalt voor alle TK-aangenomen of bij-EK-aanhangige wetsvoorstellen de huidige
// status op de site van de Eerste Kamer. Geeft per wet aan in welke EK-fase
// het zich bevindt: schriftelijke voorbereiding, plenair, of in het Staatsblad.
//
// EK heeft geen open data API. Strategie:
//  1. Per wet zoeken op dossiernummer via /zoeken?q=NUMMER → vinden van URL.
//  2. URL ophalen, voortgangBlok1-4 elementen parsen (vol/geblokt/leeg).
//  3. Resultaat naar data/ek-status.json schrijven, met bronHash.
//
// Gebruik:  node scripts/fetch-ek-status.mjs
// Veilig om dagelijks te draaien (idempotent, cachet 24u oud is goed genoeg).

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "ek-status.json");

const TK_BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";
const EK_BASE = "https://www.eerstekamer.nl";

function enc(s) {
  return s
    .replace(/%/g, "%25")
    .replace(/ /g, "%20")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/\+/g, "%2B");
}

// Alle door de TK afgedane wetgeving-zaken — onafhankelijk van commissie.
// Eerder haalden we per commissie op (15 vaste commissies), maar wetten onder
// andere/oudere commissies (bv. 'Digitale Zaken', 'Economische Zaken en
// Klimaat (2017-2024)') vielen daardoor buiten de EK-status. Nu pakken we
// alles, zodat elke wet die via een directe link bereikbaar is een correcte
// EK-fase krijgt. Pagineren via @odata.nextLink (server-page size = 250).
async function alleAfgedaneWetten() {
  const filter =
    "Verwijderd eq false and Soort eq 'Wetgeving' and Afgedaan eq true";
  const params =
    `$filter=${enc(filter)}&$expand=Kamerstukdossier($select=Nummer)` +
    `&$select=Id,Nummer,Titel`;
  let url = `${TK_BASE}/Zaak?${params}`;
  const out = [];
  let pagina = 0;
  while (url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`TK ${res.status}`);
    const d = await res.json();
    out.push(...(d.value ?? []));
    url = d["@odata.nextLink"] ?? null;
    pagina++;
    if (pagina > 50) break; // veiligheidsrem tegen oneindige paginatie
  }
  return out;
}

async function ekUrlVoorDossier(nummer) {
  const res = await fetch(`${EK_BASE}/zoeken?q=${nummer}&type=wetsvoorstel`, {
    headers: { "User-Agent": "Wetgevingsmonitor/0.1 (educational)" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const m = html.match(new RegExp(`href="(/wetsvoorstel/${nummer}_[^"]+)"`));
  return m ? `${EK_BASE}${m[1]}` : null;
}

function parseEkVoortgang(html) {
  // Per voortgangBlok lezen we (a) de state-class (vol/geblokt/leeg) én
  // (b) het fase-label uit <span class="fase ellip">. Het label is meestal
  // beschrijvend ("Schriftelijke voorbereiding", "Plenair", "Afkondiging")
  // maar bij terminale states bevat het <strong>Ingetrokken</strong> of
  // <strong>Verworpen</strong>. Die labels zijn essentieel voor correcte
  // fase-classificatie.
  //
  // Blokken: 1=Indiening EK / ontvangst, 2=Schriftelijke voorbereiding,
  //          3=Plenair, 4=Afkondiging/Staatsblad.
  const states = [null, null, null, null];
  const labels = [null, null, null, null];
  for (let i = 1; i <= 4; i++) {
    const blokRe = new RegExp(
      `voortgangBlok${i}[^>]*>\\s*<div class="(vol|geblokt|leeg)"[^>]*>` +
        `[\\s\\S]*?<span class="fase ellip">\\s*(?:<strong>)?\\s*([^<]*?)\\s*(?:</strong>)?\\s*</span>`,
      "i",
    );
    const m = html.match(blokRe);
    if (m) {
      states[i - 1] = m[1];
      labels[i - 1] = (m[2] || "").trim();
    }
  }

  // Detecteer terminale states uit labels.
  const ingetrokken = labels.some((l) => l && /ingetrokken/i.test(l));
  const verworpen = labels.some((l) => l && /verworpen/i.test(l));

  const inTK = /class="tweedekamer ellip voortgangM/.test(html);
  const inEK = /class="eerstekamer[12] ellip voortgangM/.test(html);
  const inStaatsblad = /class="staatsblad ellip voortgangM/.test(html);

  // Fase-mapping (volgorde van checken matters — terminale eerst):
  let fase = "aangenomen_tk";
  let label = "Aangenomen door TK";
  if (ingetrokken) {
    fase = "ingetrokken";
    label = "Ingetrokken";
  } else if (verworpen) {
    fase = "verworpen";
    label = "Verworpen door Eerste Kamer";
  } else if (states[3] === "vol") {
    fase = "wet";
    label = "In Staatsblad gepubliceerd";
  } else if (states[3] === "geblokt") {
    // EK heeft aangenomen, wacht nu op bekrachtiging (Afkondiging-fase loopt)
    fase = "aangenomen_ek";
    label = "Aangenomen door Eerste Kamer (in afkondiging)";
  } else if (states[2] === "vol") {
    fase = "aangenomen_ek";
    label = "Aangenomen door Eerste Kamer";
  } else if (states[2] === "geblokt") {
    fase = "in_eerste_kamer";
    label = "Plenaire behandeling Eerste Kamer";
  } else if (states[1] === "geblokt" || states[1] === "vol") {
    fase = "in_eerste_kamer";
    label = "Schriftelijke voorbereiding Eerste Kamer";
  } else if (states[0] === "geblokt") {
    // Blok 1 actief zonder bekend terminaal label: ontvangst bij EK loopt
    fase = "in_eerste_kamer";
    label = "Ontvangen door Eerste Kamer";
  }
  return {
    fase,
    label,
    blokken: states,
    blokLabels: labels,
    indicators: { inTK, inEK, inStaatsblad },
  };
}

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT, "utf8"));
  } catch {}

  // Stap 1: verzamel alle door de TK afgedane wetgeving-zaken met dossiernummer
  const seen = new Map();
  let zonderDossier = 0;
  try {
    const lijst = await alleAfgedaneWetten();
    for (const z of lijst) {
      const dnr = z.Kamerstukdossier?.[0]?.Nummer;
      if (!dnr) {
        zonderDossier++;
        continue;
      }
      if (seen.has(z.Id)) continue;
      seen.set(z.Id, { tkId: z.Id, dossiernummer: dnr, titel: z.Titel });
    }
    console.log(`afgedane wetgeving-zaken: ${lijst.length}`);
  } catch (e) {
    console.error(`ophalen mislukt: ${e.message}`);
  }
  console.log(
    `unieke wetten met dossiernummer: ${seen.size} (${zonderDossier} zonder dossier overgeslagen)`,
  );

  // Stap 2: voor elk: EK URL vinden + voortgang parsen
  const forceAll = process.argv.includes("--force");
  const TERMINAAL = new Set(["wet", "verworpen", "ingetrokken"]);
  let nieuw = 0;
  let skip = 0;
  let now = Date.now();
  for (const [tkId, info] of seen) {
    const prev = existing[tkId];
    if (!forceAll && prev) {
      // Terminale states (in Staatsblad, verworpen, ingetrokken) veranderen
      // niet meer — eenmaal gescrapet permanent overslaan. Houdt de wekelijkse
      // run snel ondanks de grotere dekking (top 200 per commissie).
      if (prev.gevonden && TERMINAAL.has(prev.fase)) {
        skip++;
        continue;
      }
      // Niet-terminale records: skip als minder dan 12 uur oud.
      if (prev.gegenereerdOp) {
        const age = now - new Date(prev.gegenereerdOp).getTime();
        if (age < 12 * 60 * 60 * 1000) {
          skip++;
          continue;
        }
      }
    }
    try {
      const url = await ekUrlVoorDossier(info.dossiernummer);
      if (!url) {
        existing[tkId] = {
          dossiernummer: info.dossiernummer,
          gevonden: false,
          gegenereerdOp: new Date().toISOString(),
        };
        nieuw++;
        continue;
      }
      const res = await fetch(url, {
        headers: { "User-Agent": "Wetgevingsmonitor/0.1 (educational)" },
      });
      if (!res.ok) {
        console.error(`  ${info.dossiernummer}: EK ${res.status}`);
        continue;
      }
      const html = await res.text();
      const parsed = parseEkVoortgang(html);
      existing[tkId] = {
        dossiernummer: info.dossiernummer,
        ekUrl: url,
        gevonden: true,
        ...parsed,
        gegenereerdOp: new Date().toISOString(),
      };
      nieuw++;
      console.log(
        `  ${info.dossiernummer} → ${parsed.label} (${parsed.blokken.join("/")})`,
      );
      if (nieuw % 10 === 0) {
        await fs.writeFile(OUT, JSON.stringify(existing, null, 2));
      }
      // Beleefdheid tegenover EK-server
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`  ${info.dossiernummer}: ${e.message}`);
    }
  }

  await fs.writeFile(OUT, JSON.stringify(existing, null, 2));
  console.log(`klaar. ${nieuw} bijgewerkt, ${skip} overgeslagen (vers).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
