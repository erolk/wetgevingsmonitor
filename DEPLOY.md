# Deploy naar Vercel — stappenplan

Doel: de site live krijgen op een Vercel-URL (bv.
`wetgevingsmonitor-x.vercel.app`) via GitHub. Daarna kun je optioneel een
eigen domein koppelen.

**Wat werkt direct:** alle pagina's, filters, EK-status, procesbalk,
burger-uitleg.
**Wat nog niet werkt op productie:** de subscribe-knop (toont een
"binnenkort beschikbaar"-melding). Daarvoor moet je later een database
toevoegen — zie [Stap 5: Subscribe activeren](#stap-5-subscribe-activeren-productie).

---

## Stap 1 — Lokale repo klaarmaken

```bash
cd ~/Desktop/VolkshuisvestingMonitor

git init
git add .
git commit -m "Initial commit: Wetgevingsmonitor MVP"
```

Check dat `.gitignore` correct is (zou al moeten):
- `node_modules`, `.next`, `.env*.local`, `data/outbox/`, `data/subscriptions.json`, `data/snapshot.json` worden níet gecommit.
- `data/explanations.json` en `data/ek-status.json` worden **wel** gecommit (die heeft de site nodig).

## Stap 2 — GitHub repo aanmaken

1. Ga naar https://github.com/new
2. Repository name: `wetgevingsmonitor` (of wat je wil)
3. Visibility: **Public** of **Private** — beide werkt met Vercel
4. Klik `Create repository` — **niet** "Initialize with README" aanvinken
5. Volg de instructies "…or push an existing repository from the command line":

   ```bash
   git remote add origin https://github.com/<jouw-username>/wetgevingsmonitor.git
   git branch -M main
   git push -u origin main
   ```

## Stap 3 — Vercel project aanmaken

1. Ga naar https://vercel.com/new
2. Log in met GitHub (eerste keer: autoriseer Vercel toegang tot je repos)
3. Bij "Import Git Repository": kies `wetgevingsmonitor`
4. **Configure Project:**
   - Framework Preset: Next.js (automatisch gedetecteerd)
   - Root Directory: laat leeg (=`.`)
   - Build/Output settings: standaard, niets aanpassen
5. **Environment Variables** — voeg toe:

   | Naam | Waarde |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://<projectnaam>.vercel.app` (Vercel laat je domein straks zien — dit kan ook later) |
   | `EMAIL_MODE` | `file` (placeholder — niet actief op Vercel, blokkeert geen deploy) |

   *Resend / Anthropic vars zijn pas nodig in stap 5/6.*

6. Klik **Deploy**. Eerste build duurt 2-3 minuten.

## Stap 4 — Eigen domein koppelen (optioneel)

Op de Vercel-dashboard van je project:
1. Settings → Domains → "Add"
2. Vul in: `wetgevingsmonitor.nl` (of een ander domein dat je bezit)
3. Vercel laat je DNS-records zien die je moet instellen bij je domein-registrar (TransIP, SIDN, etc.). Meestal één A-record en/of CNAME.
4. Na DNS-propagatie (5 min - 24u) → automatisch HTTPS.
5. Update `NEXT_PUBLIC_SITE_URL` naar je nieuwe domein en redeploy (Settings → Deployments → "Redeploy").

## Stap 5 — Subscribe activeren (productie)

De subscribe-knop werkt nu niet op Vercel omdat het bestandssysteem
read-only is. Voor productie moet je de file-based storage vervangen door
een database. Aanbevolen: **Vercel Postgres** (gratis tier voldoet).

Hoofdlijnen (~2 uur werk):

1. **Vercel Postgres aanmaken**
   - Dashboard → Storage → "Create Database" → Postgres → Free tier
   - Vercel zet automatisch `POSTGRES_URL` env var in je project
2. **Tabellen aanmaken** (via Vercel CLI of psql):
   ```sql
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY,
     email TEXT NOT NULL,
     target_type TEXT NOT NULL,
     target_id TEXT NOT NULL,
     target_label TEXT NOT NULL,
     status TEXT NOT NULL,
     confirm_token TEXT UNIQUE,
     unsubscribe_token TEXT UNIQUE,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     confirmed_at TIMESTAMPTZ
   );
   CREATE TABLE snapshots (
     wet_id UUID PRIMARY KEY,
     data JSONB NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. **`lib/subscriptions.ts` herschrijven** naar `@vercel/postgres` calls (`sql\`SELECT…\``). Interface blijft hetzelfde, alleen de implementatie verandert.
4. **Resend opzetten:**
   - https://resend.com/signup (gratis tot 3.000 mails/maand)
   - Add Domain → vul DNS-records bij domein-registrar (SPF + DKIM + DMARC)
   - 24u wachten op propagatie
   - API key kopiëren → in Vercel env vars zetten als `RESEND_API_KEY`
   - `EMAIL_MODE` op `resend` zetten, `EMAIL_FROM` op een geverifieerd adres
5. **Cron job toevoegen** in `vercel.json`:
   ```json
   {
     "crons": [
       { "path": "/api/cron/check-updates", "schedule": "0 7 * * *" }
     ]
   }
   ```
   En verplaats `scripts/check-updates.mjs` logica naar
   `app/api/cron/check-updates/route.ts` (lees uit Postgres i.p.v. JSON files).

## Stap 6 — EK-status verversen (cron of handmatig)

EK-data ververst niet automatisch op Vercel (het script draait lokaal). Drie opties:

- **Optie A (eenvoudig):** draai `npm run ek-status` lokaal, commit
  `data/ek-status.json`, push. Vercel deployt het direct mee.
- **Optie B (geautomatiseerd):** GitHub Action die dagelijks het script
  draait en een PR/commit maakt.
- **Optie C (volwaardig):** verhuis ook EK-status naar Postgres en draai het
  via Vercel Cron, samen met check-updates.

## Daarna

Push naar `main` → Vercel deployt automatisch. Pull requests → preview-URLs.
Logs: Vercel dashboard → Deployments → Functions.

## Foutopsporing

- **Build faalt:** check Vercel build logs. Vaak: ontbrekende env var of
  TypeScript-fout. Lokaal `npm run build` reproduceert.
- **`data/...json` niet gevonden in productie:** Next.js detecteert
  `fs.readFileSync` automatisch en bundelt de files, maar als het niet werkt:
  voeg in `next.config.mjs` toe:
  ```js
  experimental: { outputFileTracingIncludes: { "/**/*": ["./data/**/*"] } }
  ```
- **Subscribe geeft 503:** verwacht — kom terug bij Stap 5.
