# Overzicht — Wetgevingsmonitor

Dit document legt uit **wat de site doet, hoe alles in elkaar steekt, en welke
wijzigingen er zijn gemaakt**. Bedoeld als naslagwerk, ook als je niet
dagelijks in de code zit. (De `README.md` is de korte technische intro; dit is
het volledige plaatje.)

---

## 1. Wat de site doet

De Wetgevingsmonitor laat per ministerie zien welke Nederlandse wetsvoorstellen
in behandeling zijn: waar ze in het proces zitten (Tweede Kamer → Eerste Kamer
→ Staatsblad), wanneer er een debat of stemming is, en — in begrijpelijke taal
— wat een wet voor een gewone burger betekent.

Alles komt uit **open data**; er is geen handmatige redactie van wetsinhoud.

---

## 2. Tech-stack

| Onderdeel | Keuze |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Taal | **TypeScript** |
| Styling | **Tailwind CSS** (kleuren via CSS-variabelen, light/dark) |
| Rendering | Server components + **ISR** (dagelijkse cache via `revalidate`) |
| Opslag | Geen database — JSON-bestanden in `data/` |
| Externe AI | Anthropic API (Haiku) voor burger-uitleg, vooraf gegenereerd |

Er is bewust **geen database**: de site is grotendeels read-only en haalt
gegevens live op uit open API's, met caching.

---

## 3. Mapstructuur

```
app/                         # pagina's en API-routes (Next.js App Router)
  page.tsx                   # homepage: ministerie-grid + 'Deze week'-strip
  layout.tsx                 # globale shell: header (NL-vlag + logo) + footer
  globals.css                # kleuren-thema (light/dark) via CSS-variabelen
  ministerie/[slug]/page.tsx # overzicht per ministerie (fase-filter + lijsten)
  wet/[id]/page.tsx          # detail per wet: procesbalk, tijdlijn, stemmingen
  proces/page.tsx            # 'Hoe werkt het?' — 8 stappen + lopend/afgerond-tabel
  zoeken/page.tsx            # client-side zoeken door alle wetten
  over/, contact/, privacy/  # statische pagina's
  abonnement/...             # bevestigings-/foutpagina's voor abonneren
  api/
    wetsvoorstellen/route.ts # JSON-API: ministeries met tellingen
    zoek/route.ts            # bouwt de zoek-index (1x per dag)
    contact/route.ts         # contactformulier (validatie + rate limit)
    subscribe/route.ts       # abonneren (+ confirm/unsubscribe subroutes)

components/                  # herbruikbare UI
  ProcesBalk.tsx             # de 8-staps procesbalk (horizontaal/verticaal)
  BesluitenLijst.tsx         # besluiten + stemmingen, procedurele inklapbaar
  StemmingDetail.tsx         # stemuitslag per fractie, uitklap naar Kamerleden
  SubscribeButton.tsx        # abonneer-modal (met backdrop-blur)
  ContactForm.tsx            # contactformulier
  UitklapLijst.tsx           # generieke 'toon meer/minder'-lijst
  NLVlag.tsx                 # SVG Nederlandse vlag (header-logo)
  ThemeToggle.tsx            # licht/donker schakelaar
  LanguageToggle.tsx         # NL/EN schakelaar (nu niet in de header gebruikt)

lib/                         # data-logica en hulpfuncties (geen UI)
  tk-api.ts                  # Tweede Kamer OData-client + fase-bepaling
  types.ts                   # TS-types voor TK-data + genormaliseerd model
  ministeries.ts             # de 15 ministeries + commissie-mapping
  fase-display.ts            # fase-labels, kleuren + isAfgerond()-definitie
  proces.ts                  # de 8 processtappen + fase→stap-mapping
  ek-status.ts               # leest data/ek-status.json (Eerste Kamer-fase)
  debat-direct.ts            # koppelt activiteiten aan Debat Direct-video's
  explanations.ts            # leest burger-uitleg uit data/explanations.json
  wet-context.ts             # handmatige 'waarom ligt dit stil?'-notities
  stemming.ts                # aggregeert stemmingen per fractie
  subscriptions.ts           # abonnee-opslag (JSON)
  email.ts                   # mail versturen (file-modus of Resend)
  rate-limit.ts              # in-memory rate limiter voor POST-endpoints
  i18n/                      # NL/EN vertaalwoordenboeken (dict-gestuurd)
  zoek-types.ts              # types voor de zoek-index

data/                        # statische/gecachte data (deels in git)
  explanations.json          # burger-uitleg per wet (gegenereerd, gecommit)
  ek-status.json             # Eerste Kamer-fase per wet (gescrapet, gecommit)
  wet-context.json           # handmatige stilstand-notities (gecommit)
  subscriptions.json         # abonnees (NIET in git; lokaal/host)
  snapshot.json              # vorige toestand voor notificaties (niet in git)

scripts/                     # losse Node-scripts (handmatig of via cron)
  generate-explanations.mjs  # genereert burger-uitleg via Claude API
  fetch-ek-status.mjs        # scrapet Eerste Kamer-status
  check-updates.mjs          # detecteert wijzigingen → mailt abonnees

.github/workflows/
  ek-status.yml              # wekelijkse automatische EK-scrape
```

---

## 4. Waar de gegevens vandaan komen

| Bron | Wat | Hoe |
|---|---|---|
| **Tweede Kamer Open Data** (OData v4) | Wetten, activiteiten, besluiten, stemmingen | Live opgehaald, dagelijks gecached. Geen scrape nodig. |
| **Eerste Kamer** (geen API) | EK-fase per wet | Gescrapet door `fetch-ek-status.mjs` → `ek-status.json`. Wekelijkse GitHub Action. |
| **Debat Direct** (publieke API) | Video's van debatten | `debat-direct.ts` matcht activiteiten op datum + titel. |
| **Anthropic Claude API** | Burger-uitleg ('jip-en-janneke') | `generate-explanations.mjs` → `explanations.json`. Handmatig of via cron. |

Belangrijk: de TK-data is altijd actueel (live + cache). Alleen de EK-status en
de burger-uitleg worden vooraf gegenereerd en in JSON-bestanden bewaard, omdat
daar respectievelijk geen API en een betaalde AI-call voor nodig is.

---

## 5. Belangrijke logica (de "regels" van de site)

### Fase van een wet
`lib/tk-api.ts → bepaalFase()` leidt uit de TK-data af waar een wet zit
(ingediend, in commissie, plenair, stemming, aangenomen TK, …). Als de TK ermee
klaar is (`Afgedaan`), wordt de fase verfijnd met de **Eerste Kamer-status**
uit `ek-status.json` (schriftelijk → plenair → aangenomen EK → wet, of
verworpen/ingetrokken).

### Lopend vs. afgerond
Bepaald door de **fase**, niet door de TK-vlag (`lib/fase-display.ts →
isAfgerond()`):
- **Afgerond** = `aangenomen_ek`, `wet` (Staatsblad), `verworpen`, `ingetrokken`
- **Lopend** = al het andere, inclusief `in_eerste_kamer`

Reden: de TK zet `Afgedaan=true` zodra een wet naar de Eerste Kamer gaat —
maar dan is die nog volop in behandeling. Zie de uitleg-tabel op `/proces`.

### Stilstand-detectie
`app/wet/[id]/page.tsx`: een wet krijgt een geel "Waarom ligt deze wet stil?"-
kader als de laatste activiteit >6 maanden oud is én de wet niet afgerond is.
Daarnaast kan er een handmatige notitie staan in `data/wet-context.json`.

### Stemmingen
`lib/stemming.ts` aggregeert per fractie. Bij een **hoofdelijke stemming**
(elk Kamerlid stemt apart) worden de stemmen per fractie geteld én is er een
uitklap naar de individuele Kamerleden. Procedurele besluiten staan
ingeklapt.

### Tweetaligheid (NL/EN)
`lib/i18n/` bevat woordenboeken. De infrastructuur staat er volledig, maar de
zichtbare taalschakelaar is uit de header gehaald — de site is nu NL.

---

## 6. Automatisering

| Taak | Hoe | Status |
|---|---|---|
| TK-data verversen | Automatisch (ISR-cache, dagelijks) | ✅ |
| EK-status scrapen | **GitHub Action**, elke maandag 06:00 UTC | ✅ |
| Burger-uitleg genereren | `npm run explain` (Claude API) | ⏳ handmatig |
| Notificatie-mails | `check-updates.mjs` | ⏳ niet live |

De EK-Action slaat terminale states (Staatsblad/verworpen/ingetrokken)
permanent over, dus de wekelijkse run blijft licht (~46 actieve wetten).

---

## 7. Beveiliging

- **HTTP-securityheaders** + Content-Security-Policy (`next.config.mjs`):
  anti-clickjacking, MIME-sniffing uit, HTTPS afdwingen, permissions beperkt.
- **Inputvalidatie**: contact- en abonneerformulier (lengte, e-mail, honeypot).
- **Rate limiting** (`lib/rate-limit.ts`): max 5 POSTs per IP per 10 min.
- **Geen injectie/XSS**: queries uit vaste lijst, React ontsnapt tekst.
- **Dependencies**: `npm audit` schoon (0 vulnerabilities).
- Nog op host/domein-niveau te doen: HTTPS + DDoS-bescherming (Cloudflare),
  2FA op GitHub/host/domeinregistrar.

---

## 8. Wat nog niet live is

De **abonneer-functie** is volledig gebouwd (double opt-in, bevestigingsmail,
uitschrijven, notificatiescript), maar werkt nog niet op een serverless host
(Vercel) omdat:
1. het bestandssysteem alleen-lezen is → abonnees kunnen niet worden opgeslagen;
2. e-mail standaard in "file"-modus staat (geen echte verzending).

Om live te gaan: een echte opslag (database of een host met schijf), **Resend**
voor e-mail, en een **cron** voor de notificaties.

---

## 9. Changelog (grote lijnen)

**Mei 2026 — beveiliging & data-correctheid**
- Rate limiting op contact-/abonneer-endpoints; `npm audit` schoongemaakt.
- HTTP-securityheaders + CSP toegevoegd.
- Nederlandse vlag in header; wordmark → "NLwetgevingsmonitor".
- EK-scraper **commissie-onafhankelijk** gemaakt (alle ~2400 afgedane wetten
  gedekt; eerder vielen oudere wetten buiten de boot).
- EK-status correctie: **ingetrokken** en **verworpen** wetten worden nu
  juist herkend (waren ten onrechte "aangenomen").
- "Afgerond" opnieuw gedefinieerd op fase i.p.v. de TK-vlag — wetten die nog
  bij de Eerste Kamer liggen tellen weer als lopend.
- Wekelijkse GitHub Action voor de EK-scrape.
- Stilstand-kader op de wet-detailpagina (auto + handmatige context).
- 'Deze week op de TK-agenda'-strip op de homepage (via Debat Direct).
- Debat Direct video-koppeling per activiteit.

**Mei 2026 — features & UI**
- Stemmingen aggregeren per fractie (+ Kamerleden bij hoofdelijke stemming).
- Ministerie-pagina opgeschoond: fase-strip als filter.
- Inklapbare lijsten ('toon meer').
- Tweetalige infrastructuur (NL/EN) opgezet (toggle later weggehaald).
- Procesbalk netter uitgelijnd; diverse kleur- en mobiel-fixes.
- Contactpagina toegevoegd; abonneer-knop als modal.

**Mei 2026 — basis**
- Zoekfunctie, social icons.
- Mobiel responsive gemaakt.
- Eerste versie (MVP): ministerie-overzicht, wet-detail, proces-uitleg.

Voor de exacte, volledige historie: `git log`.
