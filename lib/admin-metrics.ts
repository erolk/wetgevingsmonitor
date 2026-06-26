import fs from "node:fs";
import path from "node:path";
import { MINISTERIES, type Ministerie } from "./ministeries";
import { fetchWetsvoorstellenVoorCommissie, normalize } from "./tk-api";
import type { WetVoorstel } from "./types";
import { isAfgerond } from "./fase-display";
import { getAlleUitleg } from "./explanations";
import { getAbonneeStats, type AbonneeStats } from "./subscriptions";
import { getEmailLog, type EmailLogOverzicht } from "./email-log";
import { getRunStatus, type RunStatus } from "./run-status";
import { getAuditRapport as leesAudit, type AuditRapport } from "./audit";
import { emailMode } from "./email";

// Re-export voor backwards compat: admin-page importeert AuditRapport van hier.
export type { AuditRapport } from "./audit";

const ZES_MAANDEN_MS = 1000 * 60 * 60 * 24 * 183;
const SCRAPE_VEROUDERD_DAGEN = 10;

export type WetMetMinisterie = { wet: WetVoorstel; ministerie: Ministerie };

async function gatherAlleWetten(): Promise<WetMetMinisterie[]> {
  const perMinisterie = await Promise.all(
    MINISTERIES.map(async (m) => {
      try {
        const zaken = await fetchWetsvoorstellenVoorCommissie(m.commissie, 200);
        return zaken.map((z) => ({ wet: normalize(z), ministerie: m }));
      } catch {
        return [] as WetMetMinisterie[];
      }
    }),
  );
  // Dedupe op wet-id (een zaak hoort bij één voortouwcommissie, maar zeker is zeker).
  const gezien = new Set<string>();
  const result: WetMetMinisterie[] = [];
  for (const entry of perMinisterie.flat()) {
    if (gezien.has(entry.wet.id)) continue;
    gezien.add(entry.wet.id);
    result.push(entry);
  }
  return result;
}

/** Laatste beweging = eerstvolgende toekomstige óf meest recente activiteit,
 * met terugval op besluit/start. Gebruikt voor stilstand-detectie. */
function laatsteBewegingMs(w: WetVoorstel): number {
  const kandidaten = [
    w.volgendeActiviteit?.datum,
    w.laatsteBesluit?.gewijzigdOp,
    w.gestartOp,
  ].filter((d): d is string => !!d);
  const tijden = kandidaten.map((d) => new Date(d).getTime());
  return tijden.length ? Math.max(...tijden) : 0;
}

function heeftAankomendeActiviteit(w: WetVoorstel): boolean {
  const d = w.volgendeActiviteit?.datum;
  return d != null && new Date(d).getTime() >= Date.now();
}

export type ApiHealth = {
  naam: string;
  ok: boolean;
  status: number | null;
  ms: number | null;
};

async function ping(naam: string, url: string): Promise<ApiHealth> {
  const start = Date.now();
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });
    return { naam, ok: res.ok, status: res.status, ms: Date.now() - start };
  } catch {
    return { naam, ok: false, status: null, ms: null };
  } finally {
    clearTimeout(t);
  }
}

function ekStatusMeta(): { aantal: number; laatste: string | null } {
  try {
    const p = path.join(process.cwd(), "data", "ek-status.json");
    const data = JSON.parse(fs.readFileSync(p, "utf8")) as Record<
      string,
      { gegenereerdOp?: string }
    >;
    const ids = Object.keys(data);
    let laatste: string | null = null;
    for (const id of ids) {
      const g = data[id].gegenereerdOp;
      if (g && (!laatste || g > laatste)) laatste = g;
    }
    return { aantal: ids.length, laatste };
  } catch {
    return { aantal: 0, laatste: null };
  }
}

export type AdminMetrics = {
  wetten: {
    totaal: number;
    lopend: number;
    afgerond: number;
    samengevat: number;
    samengevatPct: number;
    lopendSamengevat: number;
    lopendSamengevatPct: number;
    uitlegInBestand: number;
  };
  zonderSamenvatting: WetMetMinisterie[];
  stilliggend: { entry: WetMetMinisterie; laatste: string | null }[];
  abonnees: AbonneeStats;
  emailMode: "file" | "resend";
  emailLog: EmailLogOverzicht;
  ek: {
    aantal: number;
    laatste: string | null;
    verouderd: boolean;
    dagenOud: number | null;
  };
  runStatus: Record<string, RunStatus>;
  apiHealth: ApiHealth[];
  tkBereikbaar: boolean;
  audit: AuditRapport | null;
};

export async function verzamelMetrics(): Promise<AdminMetrics> {
  const [alleWetten, abonnees, apiHealth] = await Promise.all([
    gatherAlleWetten(),
    getAbonneeStats().catch(
      (): AbonneeStats => ({
        totaal: 0,
        bevestigd: 0,
        inAfwachting: 0,
        perType: { wet: 0, ministerie: 0 },
      }),
    ),
    Promise.all([
      ping("Tweede Kamer Open Data", "https://gegevensmagazijn.tweedekamer.nl/OData/v4/2.0/Zaak?$top=1"),
      ping("Eerste Kamer", "https://www.eerstekamer.nl/"),
      ping(
        "Debat Direct",
        `https://api.debatdirect.tweedekamer.nl/agenda/${new Date()
          .toISOString()
          .slice(0, 10)}`,
      ),
    ]),
  ]);

  const uitleg = getAlleUitleg();
  const lopend = alleWetten.filter((e) => !isAfgerond(e.wet.fase));
  const afgerond = alleWetten.length - lopend.length;
  const samengevat = alleWetten.filter((e) => !!uitleg[e.wet.id]).length;
  const lopendSamengevat = lopend.filter((e) => !!uitleg[e.wet.id]).length;

  const zonderSamenvatting = lopend
    .filter((e) => !uitleg[e.wet.id])
    .sort(
      (a, b) =>
        new Date(b.wet.gestartOp ?? 0).getTime() -
        new Date(a.wet.gestartOp ?? 0).getTime(),
    )
    .slice(0, 25);

  const nu = Date.now();
  const stilliggend = lopend
    .filter(
      (e) =>
        !heeftAankomendeActiviteit(e.wet) &&
        nu - laatsteBewegingMs(e.wet) > ZES_MAANDEN_MS,
    )
    .map((e) => ({
      entry: e,
      laatste: e.wet.volgendeActiviteit?.datum ?? e.wet.gestartOp ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(a.laatste ?? 0).getTime() -
        new Date(b.laatste ?? 0).getTime(),
    )
    .slice(0, 25);

  const ekMeta = ekStatusMeta();
  const dagenOud = ekMeta.laatste
    ? Math.floor((nu - new Date(ekMeta.laatste).getTime()) / 86_400_000)
    : null;

  return {
    wetten: {
      totaal: alleWetten.length,
      lopend: lopend.length,
      afgerond,
      samengevat,
      samengevatPct: alleWetten.length
        ? Math.round((samengevat / alleWetten.length) * 100)
        : 0,
      lopendSamengevat,
      lopendSamengevatPct: lopend.length
        ? Math.round((lopendSamengevat / lopend.length) * 100)
        : 0,
      uitlegInBestand: Object.keys(uitleg).length,
    },
    zonderSamenvatting,
    stilliggend,
    abonnees,
    emailMode: emailMode(),
    emailLog: getEmailLog(15),
    ek: {
      aantal: ekMeta.aantal,
      laatste: ekMeta.laatste,
      verouderd: dagenOud != null && dagenOud > SCRAPE_VEROUDERD_DAGEN,
      dagenOud,
    },
    runStatus: getRunStatus(),
    apiHealth,
    tkBereikbaar: alleWetten.length > 0,
    audit: leesAudit(),
  };
}
