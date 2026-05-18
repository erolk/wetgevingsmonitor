#!/usr/bin/env node
// Vergelijkt de huidige toestand van alle gevolgde wetten met een snapshot
// van de vorige run, detecteert events (nieuwe activiteit, nieuw besluit,
// stemming-uitslag) en stuurt voor elke geconfirmde abonnee een mail.
//
// Snapshot in data/snapshot.json. Outbox in data/outbox/ (als EMAIL_MODE=file)
// of via Resend (als EMAIL_MODE=resend).
//
// Veilig om dagelijks of vaker te draaien — bij eerste run wordt alleen de
// snapshot weggeschreven, geen mails verstuurd.
//
// Gebruik:  node scripts/check-updates.mjs [--force-send]

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SNAPSHOT = path.join(ROOT, "data", "snapshot.json");
const SUBSCRIPTIONS = path.join(ROOT, "data", "subscriptions.json");
const TK_BASE = "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0";

const MINISTERIES = [
  ["volkshuisvesting-en-ruimtelijke-ordening", "vaste commissie voor Volkshuisvesting en Ruimtelijke Ordening", "Volkshuisvesting en Ruimtelijke Ordening"],
  ["binnenlandse-zaken", "vaste commissie voor Binnenlandse Zaken", "Binnenlandse Zaken"],
  ["justitie-en-veiligheid", "vaste commissie voor Justitie en Veiligheid", "Justitie en Veiligheid"],
  ["asiel-en-migratie", "vaste commissie voor Asiel en Migratie", "Asiel en Migratie"],
  ["onderwijs-cultuur-wetenschap", "vaste commissie voor Onderwijs, Cultuur en Wetenschap", "Onderwijs, Cultuur en Wetenschap"],
  ["volksgezondheid", "vaste commissie voor Volksgezondheid, Welzijn en Sport", "Volksgezondheid, Welzijn en Sport"],
  ["sociale-zaken", "vaste commissie voor Sociale Zaken en Werkgelegenheid", "Sociale Zaken en Werkgelegenheid"],
  ["financien", "vaste commissie voor Financiën", "Financiën"],
  ["economische-zaken", "vaste commissie voor Economische Zaken", "Economische Zaken"],
  ["klimaat-en-groene-groei", "vaste commissie voor Klimaat en Groene Groei", "Klimaat en Groene Groei"],
  ["infrastructuur-en-waterstaat", "vaste commissie voor Infrastructuur en Waterstaat", "Infrastructuur en Waterstaat"],
  ["landbouw-en-natuur", "vaste commissie voor Landbouw, Visserij, Voedselzekerheid en Natuur", "Landbouw, Visserij, Voedselzekerheid en Natuur"],
  ["defensie", "vaste commissie voor Defensie", "Defensie"],
  ["buitenlandse-zaken", "vaste commissie voor Buitenlandse Zaken", "Buitenlandse Zaken"],
  ["buitenlandse-handel-en-ontwikkeling", "vaste commissie voor Buitenlandse Handel en Ontwikkelingssamenwerking", "Buitenlandse Handel en Ontwikkelingssamenwerking"],
];

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3457").replace(/\/$/, "");
const EMAIL_MODE = process.env.EMAIL_MODE === "resend" ? "resend" : "file";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Wetgevingsmonitor <noreply@example.invalid>";

function enc(s) {
  return encodeURI(s)
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]")
    .replace(/%23/g, "%23")
    .replace(/\+/g, "%2B");
}

async function fetchAangenomenIds() {
  const ids = new Set();
  for (const [, commissie] of MINISTERIES) {
    const cm = commissie.replace(/'/g, "''");
    const filter = `Verwijderd eq false and Soort eq 'Wetgeving' and ZaakActor/any(a: a/ActorNaam eq '${cm}' and a/Relatie eq 'Voortouwcommissie')`;
    const url = `${TK_BASE}/Zaak?$filter=${enc(filter)}&$select=Id&$top=200`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const d = await res.json();
      for (const z of d.value ?? []) ids.add(z.Id);
    } catch (e) {
      console.error(`fetch fail ${commissie}: ${e.message}`);
    }
  }
  return ids;
}

async function fetchZaakDetail(id) {
  const expand =
    "Activiteit($select=Id,Onderwerp,Soort,Status,Datum)," +
    "Besluit($expand=Stemming($select=Id,Soort,ActorFractie,FractieGrootte))";
  const url = `${TK_BASE}/Zaak(${id})?$expand=${enc(expand)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  return res.json();
}

function snapshotVoor(zaak) {
  return {
    titel: zaak.Titel,
    status: zaak.Status,
    afgedaan: zaak.Afgedaan,
    activiteitIds: (zaak.Activiteit ?? []).map((a) => a.Id),
    besluitIds: (zaak.Besluit ?? []).map((b) => b.Id),
    stemmingIds: (zaak.Besluit ?? []).flatMap(
      (b) => b.Stemming?.map((s) => s.Id) ?? [],
    ),
  };
}

function detecteerEvents(zaakNu, prev) {
  const events = [];
  if (!prev) return events;
  const nieuweActiviteiten = (zaakNu.Activiteit ?? []).filter(
    (a) => !prev.activiteitIds.includes(a.Id),
  );
  const nieuweBesluiten = (zaakNu.Besluit ?? []).filter(
    (b) => !prev.besluitIds.includes(b.Id),
  );

  for (const a of nieuweActiviteiten) {
    events.push({
      type: "activiteit",
      soort: a.Soort,
      onderwerp: a.Onderwerp,
      datum: a.Datum,
      status: a.Status,
    });
  }
  for (const b of nieuweBesluiten) {
    const stemming = b.Stemming ?? [];
    events.push({
      type: "besluit",
      besluitSoort: b.BesluitSoort,
      besluitTekst: b.BesluitTekst,
      stemming: stemming.map((s) => ({
        fractie: s.ActorFractie,
        keuze: s.Soort,
        grootte: s.FractieGrootte,
      })),
    });
  }

  // Status/afgedaan veranderd?
  if (prev.status !== zaakNu.Status) {
    events.push({
      type: "status",
      van: prev.status,
      naar: zaakNu.Status,
    });
  }
  if (prev.afgedaan !== zaakNu.Afgedaan && zaakNu.Afgedaan) {
    events.push({ type: "afgedaan" });
  }
  return events;
}

function formatEvent(ev) {
  if (ev.type === "activiteit") {
    const datum = ev.datum ? new Date(ev.datum).toLocaleDateString("nl-NL") : "onbekend";
    return `📅 Nieuwe activiteit: ${ev.soort ?? "Activiteit"} op ${datum}${ev.onderwerp ? `\n   "${ev.onderwerp}"` : ""}`;
  }
  if (ev.type === "besluit") {
    let s = `🗳️ Besluit: ${ev.besluitSoort ?? "Besluit"}`;
    if (ev.besluitTekst) s += `\n   ${ev.besluitTekst}`;
    if (ev.stemming.length > 0) {
      const voor = ev.stemming
        .filter((x) => (x.keuze ?? "").toLowerCase() === "voor")
        .map((x) => `${x.fractie} (${x.grootte ?? "?"})`);
      const tegen = ev.stemming
        .filter((x) => (x.keuze ?? "").toLowerCase() === "tegen")
        .map((x) => `${x.fractie} (${x.grootte ?? "?"})`);
      const voorTotaal = voor.reduce(
        (a, t) => a + (parseInt(t.match(/\((\d+)\)/)?.[1] ?? "0", 10)),
        0,
      );
      const tegenTotaal = tegen.reduce(
        (a, t) => a + (parseInt(t.match(/\((\d+)\)/)?.[1] ?? "0", 10)),
        0,
      );
      s += `\n   Uitslag: ${voorTotaal} voor, ${tegenTotaal} tegen`;
      s += `\n   VOOR: ${voor.join(", ") || "(niemand)"}`;
      s += `\n   TEGEN: ${tegen.join(", ") || "(niemand)"}`;
    }
    return s;
  }
  if (ev.type === "status") {
    return `ℹ️ Status: ${ev.van ?? "?"} → ${ev.naar ?? "?"}`;
  }
  if (ev.type === "afgedaan") {
    return `✓ De Tweede Kamer heeft het voorstel afgedaan.`;
  }
  return JSON.stringify(ev);
}

async function sendMail(to, subject, body, unsubscribeUrl) {
  const text = body + `\n\nUitschrijven: ${unsubscribeUrl}`;
  const html = body.replace(/\n/g, "<br>") +
    `<br><br><small><a href="${unsubscribeUrl}">Uitschrijven</a></small>`;

  if (EMAIL_MODE === "file") {
    const dir = path.join(ROOT, "data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const fn = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.eml`;
    const content =
      `From: ${EMAIL_FROM}\nTo: ${to}\nSubject: ${subject}\nDate: ${new Date().toUTCString()}\nContent-Type: text/plain; charset=utf-8\n\n${text}`;
    await fs.writeFile(path.join(dir, fn), content, "utf8");
    return { ok: true, via: "file", file: fn };
  }

  // Resend
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY ontbreekt" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, text, html }),
  });
  return { ok: res.ok, via: "resend", error: res.ok ? null : await res.text() };
}

async function main() {
  let snap = {};
  try {
    snap = JSON.parse(await fs.readFile(SNAPSHOT, "utf8"));
  } catch {}
  const firstRun = Object.keys(snap).length === 0;

  let subs = [];
  try {
    subs = JSON.parse(await fs.readFile(SUBSCRIPTIONS, "utf8"));
  } catch {}
  const confirmed = subs.filter((s) => s.status === "confirmed");
  console.log(`abonnees (geconfirmd): ${confirmed.length}`);

  // Verzamel relevante wetten: alle abonnement-targets + alle wetten met
  // een ministerie-abonnement
  const watchIds = new Set();
  const ministerieToIds = new Map(); // slug → Set<wetId>

  // Eerst: alle wetten waarop iemand persoonlijk geabonneerd is
  for (const s of confirmed) {
    if (s.target.type === "wet") watchIds.add(s.target.wetId);
  }

  // Voor ministerie-abonnees: haal alle wetten per ministerie op
  const ministerieSubs = confirmed.filter((s) => s.target.type === "ministerie");
  if (ministerieSubs.length > 0) {
    for (const [slug, commissie] of MINISTERIES) {
      const heeftAbonnees = ministerieSubs.some((s) => s.target.slug === slug);
      if (!heeftAbonnees) continue;
      const cm = commissie.replace(/'/g, "''");
      const filter = `Verwijderd eq false and Soort eq 'Wetgeving' and Afgedaan eq false and ZaakActor/any(a: a/ActorNaam eq '${cm}' and a/Relatie eq 'Voortouwcommissie')`;
      const url = `${TK_BASE}/Zaak?$filter=${enc(filter)}&$select=Id&$top=200`;
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const d = await res.json();
        const ids = new Set((d.value ?? []).map((z) => z.Id));
        ministerieToIds.set(slug, ids);
        for (const id of ids) watchIds.add(id);
      } catch (e) {
        console.error(`min fetch fail ${slug}: ${e.message}`);
      }
    }
  }

  console.log(`wetten om te checken: ${watchIds.size}`);

  let nieuwe = 0;
  let mails = 0;

  for (const id of watchIds) {
    const zaak = await fetchZaakDetail(id);
    if (!zaak) continue;

    const huidigeSnap = snapshotVoor(zaak);
    const prev = snap[id];
    const events = detecteerEvents(zaak, prev);

    snap[id] = huidigeSnap;
    if (events.length === 0) continue;
    nieuwe++;
    console.log(`  ${zaak.Nummer} (${zaak.Titel.slice(0, 60)}): ${events.length} event(s)`);

    if (firstRun) continue; // alleen snapshot opbouwen op 1e run

    // Welke abonnees moeten dit krijgen?
    const ontvangers = new Set();
    for (const s of confirmed) {
      if (s.target.type === "wet" && s.target.wetId === id) {
        ontvangers.add(s.id);
      } else if (s.target.type === "ministerie") {
        const ids = ministerieToIds.get(s.target.slug);
        if (ids?.has(id)) ontvangers.add(s.id);
      }
    }
    if (ontvangers.size === 0) continue;

    const subject = `[Wetgevingsmonitor] Update over: ${zaak.Titel.slice(0, 80)}`;
    const eventsTekst = events.map(formatEvent).join("\n\n");
    const detailUrl = `${SITE}/wet/${id}`;
    const body = `Er is iets gebeurd rond een wet die je volgt:

${zaak.Titel}

${eventsTekst}

Bekijk de volledige tijdlijn: ${detailUrl}`;

    for (const subId of ontvangers) {
      const sub = subs.find((s) => s.id === subId);
      if (!sub) continue;
      const unsub = `${SITE}/api/subscribe/unsubscribe?token=${sub.unsubscribeToken}`;
      const result = await sendMail(sub.email, subject, body, unsub);
      if (result.ok) mails++;
      else console.error(`  mail fout naar ${sub.email}: ${result.error}`);
    }
  }

  await fs.writeFile(SNAPSHOT, JSON.stringify(snap, null, 2));
  console.log(`klaar. ${nieuwe} wetten met nieuwe events, ${mails} mails verzonden (${EMAIL_MODE}).`);
  if (firstRun) {
    console.log("Dit was de eerste run — alleen snapshot opgebouwd, geen mails verstuurd.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
