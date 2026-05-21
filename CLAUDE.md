# CLAUDE.md — werkinstructies voor dit project

Beknopte gids voor Claude Code. Voor het volledige plaatje: zie `OVERZICHT.md`.

## Wat dit is

**Wetgevingsmonitor** (NLwetgevingsmonitor) — Next.js 15 + TypeScript +
Tailwind. Laat per ministerie zien welke NL-wetsvoorstellen in behandeling
zijn, waar in het proces, en wat ze voor de burger betekenen. Zustersite:
**EUwetgevingsmonitor** (`~/Desktop/EUwetgevingsmonitor`, aparte repo, EU-data).

## Commando's

- `npm run dev` — lokale dev-server
- `npm run build` — productie-build (draai dit om wijzigingen te verifiëren)
- `npm run ek-status` — scrapet Eerste Kamer-status → `data/ek-status.json`
- `npm run explain` — genereert burger-uitleg via Claude API (kost API-saldo)
- `npm run check-updates` — detecteert wijzigingen voor notificatie-mails

## Conventies

- **Commit-messages in het Nederlands**, beschrijvend, met de "waarom".
- **Geen database** — data leeft in `data/*.json`. `explanations.json`,
  `ek-status.json` en `wet-context.json` worden gecommit; `subscriptions.json`
  en `snapshot.json` niet (zie `.gitignore`).
- Na codewijzigingen: **typecheck** (`npx tsc --noEmit`) en bij voorkeur een
  build draaien voordat je commit.
- UI-teksten in het Nederlands. De site is **NL-only** (taalschakelaar
  verwijderd); `lib/i18n/` bestaat nog maar `getDict()` geeft altijd NL terug
  zonder cookie — bewust, want `cookies()` zou statische caching breken.

## Belangrijke regels in de code

- **Lopend vs. afgerond** wordt bepaald door de fase, NIET door de TK
  `Afgedaan`-vlag. Zie `lib/fase-display.ts → isAfgerond()`: afgerond =
  `aangenomen_ek` / `wet` / `verworpen` / `ingetrokken`. Een wet die naar de
  Eerste Kamer is doorgestuurd is `Afgedaan=true` maar nog steeds lopend.
- **Fase-bepaling**: `lib/tk-api.ts → bepaalFase()`, daarna verfijnd met de
  EK-status uit `data/ek-status.json` (alleen bij `Afgedaan`).
- **Activiteiten** zitten vaak in `Besluit.Agendapunt.Activiteit`, niet direct
  in `Zaak.Activiteit` — beide bronnen mergen (zie `app/wet/[id]/page.tsx`).

## Valkuilen / let op

- **CSP is dev/prod-gegate** in `next.config.mjs`: dev krijgt `'unsafe-eval'`
  + `ws:` (anders breekt Fast Refresh en werken client-side links niet).
  Productie blijft strikt. Niet de strikte CSP in dev forceren.
- **Abonneer-functie werkt niet op een read-only host** (Vercel): de
  JSON-opslag faalt en e-mail staat in "file"-modus. Voor productie: echte
  opslag + Resend + cron. Zie `OVERZICHT.md §8`.
- **EK-scrape draait wekelijks** via GitHub Action (`.github/workflows/`);
  terminale states worden permanent overgeslagen. Niet `--force` in de Action.
- Pagina's moeten **statisch/ISR** blijven (snel). Vermijd `cookies()`/
  `headers()` in render-paden tenzij echt nodig — dat maakt pagina's dynamisch.

## Stijl

- Geen overbodige comments; leg alleen het "waarom" uit bij niet-voor-de-hand-
  liggende keuzes.
- Verifieer wijzigingen live (dev-server / build) voordat je iets "klaar" noemt.
