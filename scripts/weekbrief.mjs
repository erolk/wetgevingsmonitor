#!/usr/bin/env node
// Stelt de wekelijkse nieuwsbrief samen: de wetsvoorstellen die deze week in de
// Tweede Kamer zijn behandeld (besluit gewijzigd in de weekperiode), met — waar
// van toepassing — de eindstemming per fractie en een jip-en-janneke-uitleg.
//
// Bron: Tweede Kamer Open Data (Besluit op Wetgeving-zaken). Uitleg uit
// data/explanations.json. Abonnees uit data/subscriptions.json (type
// "nieuwsbrief", status confirmed).
//
// Gebruik:
//   node scripts/weekbrief.mjs            -> DRY-RUN: schrijft voorbeeld naar
//                                            data/outbox/, verstuurt niets.
//   node scripts/weekbrief.mjs --vorige   -> vorige volledige week (ma t/m zo)
//   node scripts/weekbrief.mjs --send     -> verstuurt naar nieuwsbrief-abonnees
//
// Standaard dry-run, zodat je de brief eerst nakijkt vóór verzending — bij dit
// gevoelige onderwerp verstandig.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { schrijfRunStatus, logEmailPoging, maskEmail } from "./_status.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TK_BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wetgevingsmonitor.nl").replace(/\/$/, "");
const EMAIL_MODE = process.env.EMAIL_MODE === "resend" ? "resend" : "file";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Wetgevingsmonitor <noreply@example.invalid>";

const VORIGE = process.argv.includes("--vorige");
const SEND = process.argv.includes("--send");

const enc = (s) =>
  s
    .replace(/%/g, "%25")
    .replace(/ /g, "%20")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26")
    .replace(/\+/g, "%2B");

function weekRange() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = (d.getUTCDay() + 6) % 7; // 0 = maandag
  const maandag = new Date(d);
  maandag.setUTCDate(d.getUTCDate() - dow);
  if (VORIGE) {
    const start = new Date(maandag);
    start.setUTCDate(maandag.getUTCDate() - 7);
    return { start, eind: maandag };
  }
  return { start: maandag, eind: new Date(now.getTime() + 60_000) };
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const litDatum = (d) => d.toISOString().replace(/\.\d+Z$/, "Z");

async function haalBesluiten(start, eind) {
  const filter = `GewijzigdOp ge ${litDatum(start)} and GewijzigdOp lt ${litDatum(eind)} and Zaak/any(z: z/Soort eq 'Wetgeving')`;
  const expand =
    "Zaak($select=Id,Nummer,Titel,Soort)," +
    "Stemming($select=ActorFractie,FractieGrootte,Soort,ActorNaam)";
  const url = `${TK_BASE}/Besluit?$filter=${enc(filter)}&$expand=${enc(expand)}&$orderby=GewijzigdOp%20desc&$top=250`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`TK OData ${res.status}`);
  const j = await res.json();
  return j.value ?? [];
}

function aggregeerStemming(stemmingen, stemmingsSoort) {
  const hoofdelijk = (stemmingsSoort ?? "").toLowerCase().includes("hoofdelijk");
  const perFractie = new Map();
  let voor = 0;
  let tegen = 0;
  for (const s of stemmingen) {
    const fractie = (s.ActorFractie ?? "Onbekend").trim() || "Onbekend";
    const soort = (s.Soort ?? "").toLowerCase();
    const gewicht = hoofdelijk ? 1 : s.FractieGrootte ?? 1;
    if (!perFractie.has(fractie)) perFractie.set(fractie, { voor: 0, tegen: 0 });
    const r = perFractie.get(fractie);
    if (soort === "voor") {
      r.voor += gewicht;
      voor += gewicht;
    } else if (soort === "tegen") {
      r.tegen += gewicht;
      tegen += gewicht;
    }
  }
  const voorPartijen = [];
  const tegenPartijen = [];
  for (const [fractie, r] of perFractie) {
    if (r.voor > r.tegen) voorPartijen.push(fractie);
    else if (r.tegen > r.voor) tegenPartijen.push(fractie);
  }
  return { voor, tegen, voorPartijen, tegenPartijen };
}

function groepeerPerWet(besluiten) {
  const perWet = new Map();
  for (const b of besluiten) {
    const z = Array.isArray(b.Zaak) ? b.Zaak[0] : b.Zaak;
    if (!z || z.Soort !== "Wetgeving") continue;
    if (!perWet.has(z.Id)) {
      perWet.set(z.Id, { id: z.Id, nummer: z.Nummer, titel: z.Titel, soorten: new Set(), stemming: null, laatste: b.GewijzigdOp });
    }
    const w = perWet.get(z.Id);
    if (b.BesluitSoort) w.soorten.add(b.BesluitSoort);
    if (Array.isArray(b.Stemming) && b.Stemming.length > 0 && !w.stemming) {
      const u = aggregeerStemming(b.Stemming, b.StemmingsSoort);
      w.stemming = { besluitSoort: b.BesluitSoort ?? "Stemming", ...u };
    }
  }
  return [...perWet.values()];
}

function schoonTitel(t) {
  return (t ?? "").replace(/\s+/g, " ").trim();
}

function bouwBrief(weken, wkNr, uitlegMap, start, eind) {
  const periode = `${start.toLocaleDateString("nl-NL", { day: "numeric", month: "short" })} t/m ${new Date(eind.getTime() - 1).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}`;
  const aantal = weken.length;
  const subject =
    aantal === 0
      ? `Wetgevingsmonitor — week ${wkNr}: rustige week in Den Haag`
      : `Wetgevingsmonitor — week ${wkNr}: ${aantal} ${aantal === 1 ? "wet" : "wetten"} behandeld`;

  const intro = `De belangrijkste wetsvoorstellen die deze week (${periode}) in de Tweede Kamer zijn behandeld.`;

  const blokkenHtml = weken
    .map((w) => {
      const uitleg = uitlegMap[w.id];
      const watRegelt = uitleg?.watRegelt ? `<p style="margin:4px 0;color:#444">${uitleg.watRegelt}</p>` : "";
      const soorten = [...w.soorten].slice(0, 4).join(", ");
      let stem = "";
      if (w.stemming) {
        const v = w.stemming.voorPartijen.join(", ") || "—";
        const t = w.stemming.tegenPartijen.join(", ") || "—";
        stem = `<p style="margin:4px 0;font-size:13px"><strong>Stemming:</strong> voor ${w.stemming.voor}, tegen ${w.stemming.tegen}.<br><span style="color:#2e7d32">Voor:</span> ${v}<br><span style="color:#c62828">Tegen:</span> ${t}</p>`;
      }
      return `<div style="margin:0 0 18px;padding-bottom:14px;border-bottom:1px solid #eee">
<a href="${SITE}/wet/${w.id}" style="font-weight:600;color:#1a1a1a;text-decoration:none">${schoonTitel(w.titel)}</a>
${watRegelt}
<p style="margin:4px 0;color:#666;font-size:13px">Deze week: ${soorten || "behandeld"}</p>
${stem}
</div>`;
    })
    .join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
<h1 style="font-size:20px">Wetgevingsmonitor — week ${wkNr}</h1>
<p style="color:#444">${intro}</p>
${aantal === 0 ? '<p style="color:#666">Deze week zijn er geen wetsvoorstellen behandeld. Bekijk wat eraan komt op de site.</p>' : blokkenHtml}
<p style="margin-top:20px"><a href="${SITE}/migratiepact" style="color:#2c5a6a">Volg het migratiepact →</a></p>
<p style="color:#999;font-size:11px;margin-top:24px">Je ontvangt deze mail omdat je je hebt aangemeld voor de Wetgevingsmonitor-nieuwsbrief. Cijfers en stemmingen uit officiële, openbare bronnen. Deze website is geen officiële website van de Rijksoverheid.{UNSUB}</p>
</div>`;

  const blokkenText = weken
    .map((w) => {
      const uitleg = uitlegMap[w.id];
      const wr = uitleg?.watRegelt ? `\n   ${uitleg.watRegelt}` : "";
      const soorten = [...w.soorten].slice(0, 4).join(", ");
      let stem = "";
      if (w.stemming) {
        stem = `\n   Stemming: voor ${w.stemming.voor}, tegen ${w.stemming.tegen}.\n   Voor: ${w.stemming.voorPartijen.join(", ") || "—"}\n   Tegen: ${w.stemming.tegenPartijen.join(", ") || "—"}`;
      }
      return `- ${schoonTitel(w.titel)}${wr}\n   Deze week: ${soorten || "behandeld"}${stem}\n   ${SITE}/wet/${w.id}`;
    })
    .join("\n\n");

  const text = `Wetgevingsmonitor — week ${wkNr}\n\n${intro}\n\n${aantal === 0 ? "Deze week geen wetsvoorstellen behandeld." : blokkenText}\n\nVolg het migratiepact: ${SITE}/migratiepact\n{UNSUB}`;

  return { subject, html, text };
}

async function sendMail(to, subject, html, text) {
  if (EMAIL_MODE === "file") {
    const dir = path.join(ROOT, "data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const fn = `weekbrief-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.eml`;
    await fs.writeFile(
      path.join(dir, fn),
      `From: ${EMAIL_FROM}\nTo: ${to}\nSubject: ${subject}\nContent-Type: text/plain; charset=utf-8\n\n${text}`,
      "utf8",
    );
    return { ok: true, via: "file" };
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, via: "resend", error: "RESEND_API_KEY ontbreekt" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
  });
  return { ok: res.ok, via: "resend", error: res.ok ? null : await res.text() };
}

async function main() {
  const { start, eind } = weekRange();
  const wkNr = isoWeek(VORIGE ? new Date(start.getTime() + 864e5) : start);

  const besluiten = await haalBesluiten(start, eind);
  const weken = groepeerPerWet(besluiten).sort((a, b) =>
    (b.laatste ?? "").localeCompare(a.laatste ?? ""),
  );

  let uitlegMap = {};
  try {
    uitlegMap = JSON.parse(await fs.readFile(path.join(ROOT, "data", "explanations.json"), "utf8"));
  } catch {}

  const brief = bouwBrief(weken, wkNr, uitlegMap, start, eind);
  console.log(`Week ${wkNr}: ${weken.length} behandelde wetsvoorstellen.`);

  if (!SEND) {
    // Dry-run: schrijf voorbeeld weg.
    const dir = path.join(ROOT, "data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const base = path.join(dir, `weekbrief-voorbeeld-w${wkNr}`);
    await fs.writeFile(`${base}.html`, brief.html.replace("{UNSUB}", ""), "utf8");
    await fs.writeFile(`${base}.txt`, brief.text.replace("{UNSUB}", ""), "utf8");
    console.log(`DRY-RUN. Onderwerp: "${brief.subject}"`);
    console.log(`Voorbeeld: data/outbox/weekbrief-voorbeeld-w${wkNr}.html (open in browser)`);
    console.log(`Verstuur met --send naar de nieuwsbrief-abonnees.`);
    await schrijfRunStatus(ROOT, "weekbrief", {
      ok: true,
      message: `dry-run week ${wkNr}: ${weken.length} wetten`,
      aantal: weken.length,
    });
    return;
  }

  // --send: naar bevestigde nieuwsbrief-abonnees.
  let subs = [];
  try {
    subs = JSON.parse(await fs.readFile(path.join(ROOT, "data", "subscriptions.json"), "utf8"));
  } catch {}
  const ontvangers = subs.filter(
    (s) => s.status === "confirmed" && s.target?.type === "nieuwsbrief",
  );
  console.log(`Versturen naar ${ontvangers.length} nieuwsbrief-abonnees (${EMAIL_MODE})...`);

  let ok = 0;
  let fout = 0;
  for (const sub of ontvangers) {
    const unsub = `${SITE}/api/subscribe/unsubscribe?token=${sub.unsubscribeToken}`;
    const html = brief.html.replace("{UNSUB}", ` <a href="${unsub}">Uitschrijven</a>.`);
    const text = brief.text.replace("{UNSUB}", `Uitschrijven: ${unsub}`);
    const res = await sendMail(sub.email, brief.subject, html, text);
    if (res.ok) ok++;
    else {
      fout++;
      console.error(`  fout naar ${sub.email}: ${res.error}`);
    }
    await logEmailPoging(ROOT, {
      to: maskEmail(sub.email),
      subject: brief.subject,
      ok: !!res.ok,
      via: res.via,
      detail: res.ok ? undefined : String(res.error ?? ""),
    });
  }
  console.log(`Klaar. ${ok} verzonden, ${fout} fouten.`);
  await schrijfRunStatus(ROOT, "weekbrief", {
    ok: fout === 0,
    message: `week ${wkNr}: ${ok} verzonden, ${fout} fouten`,
    aantal: ok,
  });
}

main().catch(async (e) => {
  console.error(e);
  await schrijfRunStatus(ROOT, "weekbrief", { ok: false, message: e.message });
  process.exit(1);
});
