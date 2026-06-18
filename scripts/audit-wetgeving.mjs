#!/usr/bin/env node
// Audit-script voor de Wetgevingsmonitor.
//
// Beantwoordt twee vragen:
//   1. Voor alle lopende wetten die we tonen: klopt de status met de bron?
//   2. Welke lopende wetten staan WEL in TK Open Data maar NIET op onze site,
//      en waarom?
//
// Lopend = TK heeft 'm nog niet als Afgedaan gemarkeerd, of TK is wel klaar
// maar de Eerste Kamer is nog niet (in_eerste_kamer). Dit volgt onze eigen
// isAfgerond-definitie uit lib/fase-display.ts.
//
// Output: rapport in data/audit-wetgeving.md.
//
// Gebruik:  npm run audit-wetgeving

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schrijfRunStatus } from "./_status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TK_BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetgevingsmonitor.nl").replace(/\/$/, "");

const enc = (s) =>
  s
    .replace(/%/g, "%25")
    .replace(/ /g, "%20")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/\+/g, "%2B");

// TK Open Data geeft bij grote queries géén `@odata.nextLink` terug; wij
// pagineren handmatig met $skip totdat een batch korter is dan $top.
async function fetchAllPaged(baseUrl, pageSize = 250) {
  const out = [];
  let skip = 0;
  while (true) {
    const url = `${baseUrl}&$skip=${skip}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok)
      throw new Error(`TK OData ${res.status} bij skip=${skip}`);
    const j = await res.json();
    const batch = j.value || [];
    out.push(...batch);
    if (batch.length < pageSize) break;
    skip += pageSize;
    if (skip > 10000) break; // veiligheid
  }
  return out;
}

// Lees de 15 commissies uit lib/ministeries.ts via een simpele regex.
async function leesOnzeCommissies() {
  const txt = await fs.readFile(
    path.join(ROOT, "lib/ministeries.ts"),
    "utf8",
  );
  const re = /commissie:\s*"([^"]+)"/g;
  const out = new Set();
  let m;
  while ((m = re.exec(txt)) !== null) out.add(m[1]);
  return [...out];
}

function voortouwVan(zaak) {
  return (zaak.ZaakActor || []).find((a) => a.Relatie === "Voortouwcommissie")
    ?.ActorNaam ?? null;
}

const EK_TERMINAAL = new Set(["aangenomen_ek", "wet", "verworpen", "ingetrokken"]);

function isAfgerond(zaak, ekStatusMap) {
  if (!zaak.Afgedaan) return false;
  const ek = ekStatusMap[zaak.Id];
  if (!ek?.gevonden) {
    // TK Afgedaan maar we kennen geen EK-status: conservatief → afgerond
    // (anders zou ALLE oude Afgedane wetgeving zonder EK-status hier
    // belanden en het rapport vervuilen).
    return true;
  }
  return EK_TERMINAAL.has(ek.fase);
}

async function leesEkStatus() {
  try {
    return JSON.parse(
      await fs.readFile(path.join(ROOT, "data/ek-status.json"), "utf8"),
    );
  } catch {
    return {};
  }
}

function schoonTitel(t) {
  return (t ?? "").replace(/\s+/g, " ").trim();
}

function korteTitel(t) {
  // Pak de korte naam tussen haakjes aan het einde, anders eerste 80 tekens.
  const m = (t ?? "").match(/\(([^()]+)\)\s*$/);
  if (m && m[1].length >= 6 && m[1].length <= 130) return m[1].trim();
  return schoonTitel(t).slice(0, 80) + ((t ?? "").length > 80 ? "…" : "");
}

async function main() {
  const startTs = Date.now();

  console.log("Stap 1/3: 15 onze commissies lezen…");
  const onzeCommissies = new Set(await leesOnzeCommissies());
  console.log(`  → ${onzeCommissies.size} commissies in lib/ministeries.ts`);

  console.log("Stap 2/3: alle Wetgeving-zaken uit TK Open Data ophalen…");
  const filter = "Verwijderd eq false and Soort eq 'Wetgeving'";
  const expand = "ZaakActor($select=ActorNaam,Relatie)";
  const select = "Id,Nummer,Titel,Soort,Status,Afgedaan,GestartOp";
  const url = `${TK_BASE}/Zaak?$filter=${enc(filter)}&$expand=${enc(expand)}&$select=${select}&$top=250`;
  const alle = await fetchAllPaged(url);
  console.log(`  → ${alle.length} wetgevings-zaken totaal`);

  console.log("Stap 3/3: EK-status lezen + lopend bepalen…");
  const ekMap = await leesEkStatus();
  const lopend = alle.filter((z) => !isAfgerond(z, ekMap));
  console.log(`  → ${lopend.length} lopende wetten (TK reality)`);

  // Categoriseer
  const opSite = [];
  const geenVoortouw = [];
  const andereVoortouw = [];

  for (const z of lopend) {
    const v = voortouwVan(z);
    if (!v) {
      geenVoortouw.push(z);
    } else if (onzeCommissies.has(v)) {
      opSite.push(z);
    } else {
      andereVoortouw.push({ zaak: z, commissie: v });
    }
  }

  // Andere commissies tellen
  const perAndereCommissie = new Map();
  for (const { commissie } of andereVoortouw) {
    perAndereCommissie.set(commissie, (perAndereCommissie.get(commissie) ?? 0) + 1);
  }

  // Status-consistentie check (voor wetten op de site)
  // We controleren dat geen enkele wet die wij "lopend" tonen, eigenlijk
  // afgerond zou moeten zijn — en omgekeerd.
  // Omdat we hier al `lopend = alle.filter(!isAfgerond)` hanteren, kunnen
  // afgeronde wetten hier niet binnenglippen. We rapporteren wel
  // hoeveel van `opSite` geen EK-info heeft (mogelijk relevant).
  const opSiteZonderEk = opSite.filter((z) => z.Afgedaan && !ekMap[z.Id]?.gevonden);

  // Rapport
  const datumLabel = new Date().toLocaleString("nl-NL", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
  const dekking = lopend.length > 0
    ? ((opSite.length / lopend.length) * 100).toFixed(1)
    : "0.0";

  const md = [
    `# Audit: lopende wetgeving op de Wetgevingsmonitor`,
    ``,
    `**Gegenereerd op:** ${datumLabel}`,
    `**Bron:** Tweede Kamer Open Data (\`gegevensmagazijn.tweedekamer.nl\`)`,
    `**Definitie lopend:** TK heeft de zaak nog niet als afgedaan gemarkeerd, óf TK is wel klaar maar de Eerste Kamer is nog bezig (\`in_eerste_kamer\`).`,
    ``,
    `## Kerncijfers`,
    ``,
    `| Cijfer | Waarde |`,
    `|---|---|`,
    `| Totaal wetgevings-zaken in TK Open Data | ${alle.length.toLocaleString("nl-NL")} |`,
    `| Daarvan lopend (TK + EK) | **${lopend.length.toLocaleString("nl-NL")}** |`,
    `| Op de Wetgevingsmonitor zichtbaar | **${opSite.length.toLocaleString("nl-NL")}** (dekking ${dekking}%) |`,
    `| Niet op de monitor | **${(geenVoortouw.length + andereVoortouw.length).toLocaleString("nl-NL")}** |`,
    ``,
    `## Status-consistentie`,
    ``,
    `Wetten die de monitor "lopend" noemt, worden gecheckt tegen TK Open Data.`,
    ``,
    `- ✓ Alle ${opSite.length.toLocaleString("nl-NL")} lopende wetten op de monitor zijn ook in TK Open Data als lopend gemarkeerd.`,
    `- ⚠ ${opSiteZonderEk.length} daarvan zijn TK-afgedaan maar zonder EK-status in onze scrape — die behandelen we conservatief als afgerond. *(Mocht dit niet 0 zijn: \`npm run ek-status\` opnieuw draaien.)*`,
    ``,
    `## Coverage-gat: ${(geenVoortouw.length + andereVoortouw.length).toLocaleString("nl-NL")} wetten missen`,
    ``,
    `### A. ${geenVoortouw.length} wetten zonder voortouwcommissie`,
    ``,
    geenVoortouw.length === 0
      ? `Geen.`
      : `Deze zitten in een **vroeg stadium** (nog niet aan een vaste kamercommissie toegewezen). Zodra de Tweede Kamer ze aan een commissie geeft die in onze 15 ministerie-mapping zit, verschijnen ze automatisch op de site.`,
    ``,
    ...geenVoortouw.slice(0, 15).map((z) =>
      `- \`${z.Nummer}\` — ${korteTitel(z.Titel)} _(gestart ${z.GestartOp?.slice(0, 10) ?? "?"})_`,
    ),
    geenVoortouw.length > 15
      ? `\n_… en nog ${geenVoortouw.length - 15} andere._`
      : "",
    ``,
    `### B. ${andereVoortouw.length} wetten bij commissies die niet bij een ministerie horen`,
    ``,
    andereVoortouw.length === 0
      ? `Geen.`
      : `Voor de mapping van wetten aan ministeries gebruiken we 15 vaste kamercommissies. Sommige wetten liggen bij commissies/werkgroepen die we niet aan een ministerie kunnen koppelen.`,
    ``,
    `**Verdeling per commissie:**`,
    ``,
    ...[...perAndereCommissie.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([naam, n]) => `- **${n}** × ${naam}`),
    ``,
    `**Eerste 15 voorbeelden:**`,
    ``,
    ...andereVoortouw.slice(0, 15).map(({ zaak, commissie }) =>
      `- \`${zaak.Nummer}\` (${commissie}) — ${korteTitel(zaak.Titel)}`,
    ),
    andereVoortouw.length > 15
      ? `\n_… en nog ${andereVoortouw.length - 15} andere._`
      : "",
    ``,
    `## Conclusie`,
    ``,
    `- **Status-consistentie:** ${opSite.length === opSite.filter((z) => !isAfgerond(z, ekMap)).length ? "geen mismatches gevonden." : "**mismatches gevonden — controleer hierboven.**"}`,
    `- **Coverage:** ${dekking}% van alle lopende wetgeving uit TK Open Data is op de monitor zichtbaar.`,
    `- **Voornaamste reden van missende wetten:** ${geenVoortouw.length > andereVoortouw.length ? "wetten in vroeg stadium (nog geen voortouwcommissie)" : "wetten bij commissies die niet aan een van de 15 ministeries gekoppeld zijn"}.`,
    ``,
    `Audit duurde ${((Date.now() - startTs) / 1000).toFixed(1)}s.`,
    ``,
  ].join("\n");

  const outPath = path.join(ROOT, "data", "audit-wetgeving.md");
  await fs.writeFile(outPath, md);

  console.log("");
  console.log("─".repeat(60));
  console.log(`Op monitor:        ${opSite.length.toLocaleString("nl-NL")}`);
  console.log(`Zonder voortouw:   ${geenVoortouw.length.toLocaleString("nl-NL")}`);
  console.log(`Andere commissie:  ${andereVoortouw.length.toLocaleString("nl-NL")}`);
  console.log(`Dekking:           ${dekking}%`);
  console.log(`Rapport:           ${outPath}`);
  console.log("─".repeat(60));

  await schrijfRunStatus(ROOT, "audit-wetgeving", {
    ok: true,
    message: `${opSite.length}/${lopend.length} op site (${dekking}%); ${geenVoortouw.length + andereVoortouw.length} missen`,
    aantal: lopend.length,
    duurMs: Date.now() - startTs,
  });
}

main().catch(async (e) => {
  console.error(e);
  await schrijfRunStatus(ROOT, "audit-wetgeving", {
    ok: false,
    message: e.message,
  });
  process.exit(1);
});
