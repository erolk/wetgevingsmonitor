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
  const weken = [];
  const gezien = new Set();
  const re =
    /href="(\/actueel\/nieuws\/(\d{4})\/(\d{2})\/(\d{2})\/de-asielinstroom-van-week-(\d{1,2})[^"]*)"[^>]*>\s*<h3>([^<]*)<\/h3>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, hrefPad, jaar, maand, dag, week, kop] = m;
    const datum = `${jaar}-${maand}-${dag}`;
    const aantal = parseAantal(kop) ?? parseAantal(hrefPad);
    if (aantal == null) continue;
    const sleutel = `${jaar}-${week}`;
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    weken.push({
      jaar: Number(jaar),
      week: Number(week),
      datum,
      aantal,
    });
  }
  weken.sort((a, b) => a.jaar - b.jaar || a.week - b.week);
  return weken;
}

async function main() {
  const jaar = Number(process.argv[2]) || new Date().getFullYear();
  const index = await haalIndexPagina(jaar);
  if (!index) {
    throw new Error(`geen overzichtspagina gevonden voor ${jaar}`);
  }
  const weken = parseWeken(index.html);
  if (weken.length === 0) {
    throw new Error("overzichtspagina gevonden maar 0 weken geparset");
  }

  const data = {
    bijgewerkt: new Date().toISOString(),
    jaar,
    bron: index.url,
    weken,
  };
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(data, null, 2));
  console.log(
    `klaar. ${weken.length} weken (laatste: week ${weken[weken.length - 1].week} = ${weken[weken.length - 1].aantal}).`,
  );

  await schrijfRunStatus(ROOT, "asiel-instroom", {
    ok: true,
    message: `${weken.length} weken (t/m week ${weken[weken.length - 1].week})`,
    aantal: weken.length,
  });
}

main().catch(async (e) => {
  console.error(e);
  await schrijfRunStatus(ROOT, "asiel-instroom", { ok: false, message: e.message });
  process.exit(1);
});
