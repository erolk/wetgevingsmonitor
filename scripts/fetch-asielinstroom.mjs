#!/usr/bin/env node
// Scrapet de wekelijkse asielinstroom-cijfers van Rijksoverheid.nl.
//
// Rijksoverheid publiceert per week een nieuwsbericht waarin het instroom-
// cijfer IN DE KOP staat, bv. "De asielinstroom van week 21 bedroeg ongeveer
// 900." De overzichtspagina per jaar linkt naar al die berichten. We parsen
// daaruit het weeknummer (uit de URL), de datum (uit de URL) en het aantal
// (uit de kop/URL, afgerond op honderdtallen door de bron zelf).
//
// LET OP: dit is een HTML-scrape, geen officiële API. De cijfers zijn
// afgerond en de paginastructuur kan wijzigen. Maandcijfers (CBS) zijn de
// betrouwbare basis; deze weekcijfers zijn indicatief.
//
// Gebruik:  node scripts/fetch-asielinstroom.mjs [jaar]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schrijfRunStatus } from "./_status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "asielinstroom-week.json");

const UA = { "User-Agent": "Wetgevingsmonitor/0.1 (educatief; asielinstroom-monitor)" };

async function haalIndexPagina(jaar) {
  // De dag in de overzichts-URL varieert per jaar (01/01, 01/02, ...). Probeer
  // een paar kandidaten en gebruik de eerste die week-berichten bevat.
  for (const dag of ["01", "02", "03", "04", "05"]) {
    const url = `https://www.rijksoverheid.nl/documenten/publicaties/${jaar}/01/${dag}/asielinstroom-per-week-in-${jaar}`;
    try {
      const res = await fetch(url, { headers: UA });
      if (!res.ok) continue;
      const html = await res.text();
      if (/de-asielinstroom-van-week-/i.test(html)) return { url, html };
    } catch {}
  }
  return null;
}

function parseAantal(tekst) {
  // "ongeveer 900" -> 900 ; "ongeveer 1.000" -> 1000 ; "1.250" -> 1250
  const m = tekst.match(/ongeveer[- ]([\d.]+)/i);
  if (!m) return null;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseWeken(html) {
  // Parse alles uit de URL-slug zelf (jaar/maand/dag/weeknummer/cijfer).
  // Onafhankelijk van de omringende HTML-structuur, dus robuust tegen
  // Rijksoverheid-template-wijzigingen.
  const weken = [];
  const gezien = new Set();
  const re =
    /\/actueel\/nieuws\/(\d{4})\/(\d{2})\/(\d{2})\/de-asielinstroom-van-week-(\d{1,2})[a-z-]*?-([\d.]+)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, jaar, maand, dag, week, ruwAantal] = m;
    const aantal = Number(ruwAantal.replace(/\./g, ""));
    if (!Number.isFinite(aantal)) continue;
    const sleutel = `${jaar}-${week}`;
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    weken.push({
      jaar: Number(jaar),
      week: Number(week),
      datum: `${jaar}-${maand}-${dag}`,
      aantal,
    });
  }
  weken.sort((a, b) => a.jaar - b.jaar || a.week - b.week);
  return weken;
}

async function main() {
  // Rijksoverheid publiceert per kalenderjaar één indexpagina met alle
  // weekberichten. Oudere jaren (2025 en eerder) lijken offline gehaald te
  // zijn — alleen het huidige jaar is betrouwbaar te scrapen. Voor
  // jaar-op-jaar-vergelijking gebruiken we daarom CBS-maandcijfers
  // (lib/asielcijfers.ts), niet deze week-scrape.
  const args = process.argv.slice(2).filter((a) => /^\d{4}$/.test(a));
  const jaren = args.length > 0 ? args.map(Number) : [new Date().getFullYear()];

  const alleWeken = [];
  const bronnen = [];
  for (const jaar of jaren) {
    const index = await haalIndexPagina(jaar);
    if (!index) {
      console.warn(`  ${jaar}: geen overzichtspagina gevonden — overslaan`);
      continue;
    }
    const weken = parseWeken(index.html);
    console.log(`  ${jaar}: ${weken.length} weken`);
    bronnen.push({ jaar, url: index.url });
    alleWeken.push(...weken);
  }
  if (alleWeken.length === 0) {
    throw new Error("geen weken geparsed uit alle gevraagde jaren");
  }
  alleWeken.sort((a, b) => a.jaar - b.jaar || a.week - b.week);

  const data = {
    bijgewerkt: new Date().toISOString(),
    jaren,
    bronnen,
    weken: alleWeken,
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(data, null, 2));
  const laatste = alleWeken[alleWeken.length - 1];
  console.log(
    `klaar. ${alleWeken.length} weken over ${jaren.length} jaar (laatste: ${laatste.jaar} week ${laatste.week} = ${laatste.aantal}).`,
  );

  await schrijfRunStatus(ROOT, "asiel-instroom", {
    ok: true,
    message: `${alleWeken.length} weken (t/m ${laatste.jaar} wk ${laatste.week})`,
    aantal: alleWeken.length,
  });
}

main().catch(async (e) => {
  console.error(e);
  await schrijfRunStatus(ROOT, "asiel-instroom", { ok: false, message: e.message });
  process.exit(1);
});
