# Wetgevingsmonitor

Live overzicht van alle Nederlandse wetsvoorstellen per ministerie — waar
ligt het in het proces, wanneer komt er een debat of stemming, en wat
betekent het voor een gewone burger.

Doel: laten zien dat de politiek wel degelijk inhoudelijk bezig is met
wetgeving, en niet alleen aan het vergaderen is.

(Werkmap op je Desktop: `VolkshuisvestingMonitor` — de naam dateert nog van
toen alleen het ministerie van Volkshuisvesting in scope was. Hernoemen kan
veilig: `mv ~/Desktop/VolkshuisvestingMonitor ~/Desktop/wetgevingsmonitor`.)

## Tech

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind**
- Server-side data fetching met dagelijkse `revalidate` cache
- Burger-uitleg via **Claude API** (script genereert, JSON cachet)
- Geen database — alles uit open data + één JSON-bestand

## Routes

| Route | Wat |
|---|---|
| `/` | Grid van alle 15 ministeries met tellingen |
| `/ministerie/[slug]` | Lopende + afgeronde wetsvoorstellen per ministerie |
| `/wet/[id]` | Tijdlijn, besluiten, stemmingen, burger-uitleg per wetsvoorstel |
| `/over` | Bronvermelding en disclaimer |
| `/api/wetsvoorstellen` | JSON: alle ministeries met tellingen |
| `/api/wetsvoorstellen?ministerie=<slug>` | JSON: wetten van één ministerie |

## Databronnen

| Bron | Gebruik |
|---|---|
| [Tweede Kamer Open Data](https://opendata.tweedekamer.nl) — OData v4 op `gegevensmagazijn.tweedekamer.nl/OData/v4/2.0` | Zaken, activiteiten, besluiten, stemmingen |
| [Eerste Kamer](https://www.eerstekamer.nl) — gescrapet per dossiernummer (geen open data API) | EK-fase (schriftelijke voorbereiding, plenair, Staatsblad) |
| Anthropic Claude API (Haiku 4.5) | Burger-vriendelijke uitleg per wet |

## Lokaal draaien

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Burger-uitleg genereren

Voor elke wet wordt een korte uitleg getoond ("Wat betekent dit voor jou?")
op basis van de officiële titel. Die wordt eenmalig gegenereerd via de
Claude API en gecached in `data/explanations.json`.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run explain
```

Het script:

- Haalt alle huidige wetsvoorstellen voor alle 15 ministeries op (~300+ wetten)
- Slaat alleen wetten over die al een uitleg hebben met dezelfde bronHash
- Schrijft elke 5 nieuwe uitleg een tussenstand weg
- Veilig om dagelijks of wekelijks te draaien (idempotent)

Geschatte kosten: ~€0,30 voor een volledige eerste run (Haiku 4.5).

## Hoe wordt "ministerie" bepaald?

Iedere wetsvoorstel-zaak in de TK-data heeft een *voortouwcommissie*. Elke
vaste commissie correspondeert met één ministerie. Mapping staat in
`lib/ministeries.ts`. Filter:

```
Soort = 'Wetgeving'
AND ZaakActor/any(a:
    a/ActorNaam = 'vaste commissie voor <X>'
    AND a/Relatie = 'Voortouwcommissie')
```

## Structuur

```
app/
  layout.tsx                          # globale shell (header + footer)
  page.tsx                            # landingspagina: grid van ministeries
  ministerie/[slug]/page.tsx          # overzicht per ministerie
  wet/[id]/page.tsx                   # detail per wetsvoorstel
  over/page.tsx                       # bronnen + disclaimer
  api/wetsvoorstellen/route.ts        # JSON-API
lib/
  tk-api.ts                           # OData client + normalisatie
  types.ts                            # TS types
  ministeries.ts                      # 15 ministeries met commissie-mapping
  explanations.ts                     # leest data/explanations.json
  ek-status.ts                        # leest data/ek-status.json
  fase-display.ts                     # fase-blokjes (TK + EK gecombineerd)
data/
  explanations.json                   # burger-uitleg cache
  ek-status.json                      # EK-fase cache per dossiernummer
scripts/
  generate-explanations.mjs           # vult explanations.json via Claude API
  fetch-ek-status.mjs                 # vult ek-status.json door EK-site te scrapen
  check-updates.mjs                   # detecteert wijzigingen voor email-alerts
```

## EK-status verversen

Eerste Kamer heeft geen open data API. We scrapen per dossiernummer de
voortgangsblokken (vol/geblokt/leeg) en cachen dat in `data/ek-status.json`.

```bash
npm run ek-status
```

Veilig om dagelijks te draaien (idempotent, cachet 24u oud is goed genoeg).

## Roadmap

- [x] Eerste Kamer-fase integreren (scrape `eerstekamer.nl` per dossiernummer)
- [ ] **Email/notificatie-alerts** per wet of per ministerie (cron + Resend)
- [ ] Stemverhouding-totalen ("145 voor, 5 tegen")
- [ ] Filter op thema (huurregulering, stikstof, AVG, …)
- [ ] RSS-feed per ministerie
- [ ] Deploy op `wetgevingsmonitor.nl` (Vercel + Postgres voor abonnementen)

## Disclaimer

Geen officiële uiting van de Nederlandse overheid. Brondata is open en CC0.
Burger-uitleg is AI-gegenereerd op basis van openbare titels — gebruik
officiële Kamerstukken voor juridische zekerheid.
