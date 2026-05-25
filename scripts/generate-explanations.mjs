#!/usr/bin/env node
// Genereert burger-vriendelijke uitleg voor alle huidige VRO/andere ministerie-
// wetsvoorstellen via de Claude API. Resultaat wordt opgeslagen in
// data/explanations.json (gecached per wet-Id + bronHash).
//
// Gebruik:
//   ANTHROPIC_API_KEY=sk-ant-... node scripts/generate-explanations.mjs
//
// Het script slaat per Id alleen iets op als (a) er nog niets staat, of
// (b) de bronHash van de wet veranderd is. Veilig om dagelijks te draaien.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { schrijfRunStatus } from "./_status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "explanations.json");

const MODEL = "claude-haiku-4-5-20251001"; // goedkoop en snel

const MINISTERIES = [
  "vaste commissie voor Volkshuisvesting en Ruimtelijke Ordening",
  "vaste commissie voor Binnenlandse Zaken",
  "vaste commissie voor Justitie en Veiligheid",
  "vaste commissie voor Asiel en Migratie",
  "vaste commissie voor Onderwijs, Cultuur en Wetenschap",
  "vaste commissie voor Volksgezondheid, Welzijn en Sport",
  "vaste commissie voor Sociale Zaken en Werkgelegenheid",
  "vaste commissie voor Financiën",
  "vaste commissie voor Economische Zaken",
  "vaste commissie voor Klimaat en Groene Groei",
  "vaste commissie voor Infrastructuur en Waterstaat",
  "vaste commissie voor Landbouw, Visserij, Voedselzekerheid en Natuur",
  "vaste commissie voor Defensie",
  "vaste commissie voor Buitenlandse Zaken",
  "vaste commissie voor Buitenlandse Handel en Ontwikkelingssamenwerking",
];

const BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY ontbreekt in env. Stoppen.");
  process.exit(1);
}

async function odataFetch(commissie) {
  const filter = `Verwijderd eq false and Soort eq 'Wetgeving' and ZaakActor/any(a: a/ActorNaam eq '${commissie.replace(/'/g, "''")}' and a/Relatie eq 'Voortouwcommissie')`;
  const params = `$filter=${encode(filter)}&$select=Id,Nummer,Titel,Onderwerp,Afgedaan&$orderby=GestartOp%20desc&$top=200`;
  const res = await fetch(`${BASE}/Zaak?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`OData ${res.status} voor ${commissie}`);
  const d = await res.json();
  return d.value;
}

function encode(s) {
  return s
    .replace(/%/g, "%25")
    .replace(/ /g, "%20")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/\+/g, "%2B");
}

function hash(s) {
  return crypto.createHash("sha256").update(s).digest("hex").slice(0, 12);
}

async function explain(zaak) {
  const prompt = `Je krijgt een Nederlands wetsvoorstel uit de Tweede Kamer. Schrijf voor een gewone burger zonder juridische kennis een korte uitleg.

Wetsvoorstel: ${zaak.Titel}
Onderwerp: ${zaak.Onderwerp || zaak.Titel}

Geef terug, in puur JSON formaat zonder code-blokken, met deze drie velden:
- "watRegelt": 1 zin (max 25 woorden) over wat de wet regelt, in begrijpelijke taal, geen jargon
- "raaktJou": 1-2 zinnen (max 40 woorden) over hoe dit een gewone burger merkt. Geen "kan invloed hebben"-taal; concreet.
- "voorWie": een array met 1-4 korte termen van wie dit het meest raakt (bv: ["huurders","gemeenten","verhuurders"])

Antwoord uitsluitend met JSON, niets erbij.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const tekst = data.content?.[0]?.text ?? "";
  const parsed = JSON.parse(tekst);
  return parsed;
}

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT, "utf8"));
  } catch {}

  const seen = new Set();
  const zakenAll = [];
  for (const c of MINISTERIES) {
    try {
      const list = await odataFetch(c);
      for (const z of list) {
        if (seen.has(z.Id)) continue;
        seen.add(z.Id);
        zakenAll.push(z);
      }
      console.log(`  ${c}: ${list.length}`);
    } catch (e) {
      console.error(`  ${c}: ${e.message}`);
    }
  }
  console.log(`totaal unieke wetten: ${zakenAll.length}`);

  let nieuw = 0;
  for (const z of zakenAll) {
    const bronHash = hash((z.Titel ?? "") + "|" + (z.Onderwerp ?? ""));
    if (existing[z.Id]?.bronHash === bronHash) continue;

    try {
      const u = await explain(z);
      existing[z.Id] = {
        watRegelt: u.watRegelt,
        raaktJou: u.raaktJou,
        voorWie: u.voorWie,
        bronHash,
        gegenereerdOp: new Date().toISOString(),
      };
      nieuw++;
      console.log(`  + ${z.Nummer} ${z.Titel.slice(0, 60)}`);
      // Schrijf elke 5 weg zodat we partial progress bewaren.
      if (nieuw % 5 === 0) {
        await fs.writeFile(OUT, JSON.stringify(existing, null, 2));
      }
    } catch (e) {
      console.error(`  ! ${z.Nummer}: ${e.message}`);
    }
  }

  await fs.writeFile(OUT, JSON.stringify(existing, null, 2));
  console.log(`klaar. ${nieuw} nieuwe/gewijzigde uitleg toegevoegd.`);

  await schrijfRunStatus(ROOT, "explanations", {
    ok: true,
    message: `${nieuw} nieuwe/gewijzigde uitleg toegevoegd`,
    aantal: Object.keys(existing).length,
  });
}

main().catch(async (e) => {
  console.error(e);
  await schrijfRunStatus(ROOT, "explanations", {
    ok: false,
    message: e.message,
  });
  process.exit(1);
});
