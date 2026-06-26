import Link from "next/link";
import { verzamelMetrics } from "@/lib/admin-metrics";
import { FASE_LABEL } from "@/lib/fase-display";
import { logout } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtDatumTijd(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDatum(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Pill({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? "bg-emerald-100 text-emerald-900"
          : "bg-rose-100 text-rose-900"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-emerald-600" : "bg-rose-600"}`}
      />
      {children}
    </span>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <div className="text-xs text-mute">{label}</div>
      <div className="mt-1 font-serif text-2xl text-ink leading-none">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-mute">{sub}</div>}
    </div>
  );
}

function Sectie({
  titel,
  hint,
  children,
}: {
  titel: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line/60 px-4 py-2.5">
        <h2 className="font-medium text-ink">{titel}</h2>
        {hint && <p className="text-xs text-mute mt-0.5">{hint}</p>}
      </div>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

const JOB_LABEL: Record<string, string> = {
  "ek-scrape": "Eerste Kamer-status ophalen (scrape)",
  explanations: "Burger-uitleg genereren",
  "check-updates": "Notificatie-mails versturen",
};

export default async function AdminDashboard() {
  const m = await verzamelMetrics();

  return (
    <div className="space-y-6 py-2">
      {/* Kop */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">Beheer</h1>
          <p className="text-xs text-mute mt-0.5">
            Live opgehaald · {fmtDatumTijd(new Date().toISOString())}
          </p>
        </div>
        <form action={logout}>
          <button className="rounded-md border border-line px-3 py-1.5 text-sm text-mute hover:text-ink hover:border-accent transition-colors">
            Uitloggen
          </button>
        </form>
      </div>

      {/* Kerncijfers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          label="Wetten op de site"
          value={m.wetten.totaal}
          sub={`${m.wetten.lopend} lopend · ${m.wetten.afgerond} afgerond`}
        />
        <Stat
          label="Samengevat (lopend)"
          value={`${m.wetten.lopendSamengevat}/${m.wetten.lopend}`}
          sub={`${m.wetten.lopendSamengevatPct}% van lopend · ${m.wetten.samengevat} van alle (${m.wetten.samengevatPct}%)`}
        />
        <Stat
          label="Abonnees (bevestigd)"
          value={m.abonnees.bevestigd}
          sub={`${m.abonnees.inAfwachting} in afwachting · ${m.abonnees.totaal} totaal`}
        />
        <Stat
          label="E-mails verzonden"
          value={m.emailLog.totaal}
          sub={
            m.emailLog.totaal === 0
              ? "nog geen verzendlog"
              : `${m.emailLog.ok} ok · ${m.emailLog.fout} fout`
          }
        />
      </div>

      {/* Ophalen & status bijwerken */}
      <Sectie
        titel="Wetgeving ophalen & status bijwerken"
        hint="Of het ophalen van nieuwe wetgeving en het bijwerken van bestaande statussen is gelukt."
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink">Tweede Kamer Open Data (nieuwe wetgeving)</span>
            <Pill ok={m.tkBereikbaar}>
              {m.tkBereikbaar ? "opgehaald" : "niet bereikbaar"}
            </Pill>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-ink">
              Eerste Kamer-status (statusupdate bestaande wetten)
            </span>
            {m.ek.verouderd ? (
              <Pill ok={false}>
                verouderd · {m.ek.dagenOud} dagen oud
              </Pill>
            ) : (
              <Pill ok={m.ek.aantal > 0}>
                {m.ek.aantal > 0 ? "actueel" : "geen data"}
              </Pill>
            )}
          </div>
          <p className="text-xs text-mute">
            {m.ek.aantal} wetten met EK-status · laatste update{" "}
            {fmtDatumTijd(m.ek.laatste)}
            {m.ek.verouderd &&
              " — let op: de wekelijkse scrape lijkt te zijn blijven hangen."}
          </p>

          {/* Run-status van de scripts */}
          <div className="mt-2 border-t border-line/60 pt-3 space-y-2">
            {Object.keys(JOB_LABEL).map((job) => {
              const rs = m.runStatus[job];
              return (
                <div
                  key={job}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-ink">{JOB_LABEL[job]}</div>
                    {rs ? (
                      <div className="text-xs text-mute">
                        {rs.message} · {fmtDatumTijd(rs.lastRun)}
                      </div>
                    ) : (
                      <div className="text-xs text-mute">
                        nog niet gedraaid (geen run-status)
                      </div>
                    )}
                  </div>
                  {rs ? (
                    <Pill ok={rs.ok}>{rs.ok ? "gelukt" : "mislukt"}</Pill>
                  ) : (
                    <span className="text-xs text-mute shrink-0">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Sectie>

      {/* Audit: dekking lopende wetgeving */}
      <Sectie
        titel="Audit: dekking van lopende wetgeving"
        hint="Vergelijkt onze 'lopend'-lijst met alle Soort='Wetgeving'-zaken in TK Open Data. Draaien met npm run audit-wetgeving."
      >
        {!m.audit ? (
          <p className="text-sm text-mute">
            Nog niet gedraaid — voer eenmalig{" "}
            <code className="text-ink">npm run audit-wetgeving</code> uit (of
            wacht op de wekelijkse maandag-Action).
          </p>
        ) : (
          (() => {
            const a = m.audit!;
            const onder90 = a.dekking < 90;
            const onder95 = a.dekking < 95 && !onder90;
            const toon: "ok" | "mid" | "nok" = onder90
              ? "nok"
              : onder95
                ? "mid"
                : "ok";
            return (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-ink">
                      <span className="font-medium">{a.opMonitor}</span> van{" "}
                      <span className="font-medium">{a.lopendTk}</span> lopende
                      wetten zichtbaar
                    </div>
                    <div className="text-xs text-mute">
                      laatst gedraaid {fmtDatumTijd(a.bijgewerkt)} ·{" "}
                      {a.totaalTk.toLocaleString("nl-NL")} wetgevings-zaken
                      totaal in TK
                    </div>
                  </div>
                  <Pill ok={toon === "ok"}>
                    {a.dekking.toFixed(1)}% dekking
                    {onder90 && " — actie nodig"}
                  </Pill>
                </div>

                {(a.missend.geenVoortouw > 0 ||
                  a.missend.andereCommissie > 0) && (
                  <div className="border-t border-line/60 pt-3 space-y-2">
                    {a.missend.geenVoortouw > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-ink">
                          Zonder voortouwcommissie (vroeg stadium)
                        </span>
                        <span className="text-mute tabular-nums">
                          {a.missend.geenVoortouw}
                        </span>
                      </div>
                    )}
                    {a.missend.andereCommissie > 0 && (
                      <div>
                        <div className="flex justify-between gap-3">
                          <span className="text-ink">
                            Andere commissie (niet aan ministerie te koppelen)
                          </span>
                          <span className="text-mute tabular-nums">
                            {a.missend.andereCommissie}
                          </span>
                        </div>
                        {a.andereCommissies.length > 0 && (
                          <ul className="mt-1.5 text-xs text-mute space-y-0.5 pl-4">
                            {a.andereCommissies.map((c) => (
                              <li key={c.naam}>
                                {c.aantal}× {c.naam}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {onder90 && (
                  <p className="text-xs text-rose-700">
                    Dekking onder 90% — controleer of er nieuwe vaste
                    kamercommissies zijn die we niet aan een ministerie hebben
                    gekoppeld (lib/ministeries.ts).
                  </p>
                )}
              </div>
            );
          })()
        )}
      </Sectie>

      {/* Abonnees & e-mails */}
      <Sectie
        titel="Abonnees & e-mails"
        hint={`E-mailmodus: ${m.emailMode}${m.emailMode === "file" ? " (mails worden naar data/outbox geschreven, niet echt verzonden)" : ""}`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-mute text-xs">Bevestigd</div>
            <div className="text-ink font-medium">{m.abonnees.bevestigd}</div>
          </div>
          <div>
            <div className="text-mute text-xs">In afwachting</div>
            <div className="text-ink font-medium">{m.abonnees.inAfwachting}</div>
          </div>
          <div>
            <div className="text-mute text-xs">Op een wet</div>
            <div className="text-ink font-medium">{m.abonnees.perType.wet}</div>
          </div>
          <div>
            <div className="text-mute text-xs">Op een ministerie</div>
            <div className="text-ink font-medium">
              {m.abonnees.perType.ministerie}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-line/60 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Laatste verzendpogingen</span>
            {m.emailLog.totaal > 0 && (
              <span className="text-xs text-mute">
                {m.emailLog.ok} gelukt · {m.emailLog.fout} mislukt
              </span>
            )}
          </div>
          {m.emailLog.entries.length === 0 ? (
            <p className="text-xs text-mute mt-2">
              Nog geen e-mails verstuurd (of geen verzendlog op deze host).
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-line/60 text-xs">
              {m.emailLog.entries.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-1.5"
                >
                  <span className="font-mono text-mute shrink-0 w-28 tabular-nums">
                    {fmtDatumTijd(e.at)}
                  </span>
                  <span className="text-ink truncate flex-1 min-w-0">
                    {e.to}
                  </span>
                  <span className="text-mute hidden sm:block truncate flex-1 min-w-0">
                    {e.subject}
                  </span>
                  <Pill ok={e.ok}>{e.via}</Pill>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Sectie>

      {/* API-gezondheid */}
      <Sectie
        titel="API-gezondheid (bronnen)"
        hint="Live bereikbaarheid van de externe gegevensbronnen."
      >
        <ul className="space-y-2 text-sm">
          {m.apiHealth.map((a) => (
            <li
              key={a.naam}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-ink">{a.naam}</span>
              <span className="flex items-center gap-2">
                {a.ms != null && (
                  <span className="text-xs text-mute tabular-nums">
                    {a.ms} ms
                  </span>
                )}
                <Pill ok={a.ok}>
                  {a.ok ? `ok${a.status ? ` ${a.status}` : ""}` : "onbereikbaar"}
                </Pill>
              </span>
            </li>
          ))}
        </ul>
      </Sectie>

      {/* Wetten zonder samenvatting */}
      <Sectie
        titel={`Lopende wetten zonder samenvatting (${m.zonderSamenvatting.length}${m.zonderSamenvatting.length === 25 ? "+" : ""})`}
        hint="Draai 'npm run explain' om hiervoor burger-uitleg te genereren."
      >
        {m.zonderSamenvatting.length === 0 ? (
          <p className="text-sm text-mute">
            Alle lopende wetten hebben een samenvatting. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-line/60 text-sm">
            {m.zonderSamenvatting.map(({ wet, ministerie }) => (
              <li key={wet.id} className="py-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/wet/${wet.id}`}
                    className="text-ink hover:underline truncate min-w-0"
                  >
                    {wet.titel}
                  </Link>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-mute shrink-0">
                    {ministerie.afkorting}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sectie>

      {/* Stilliggende wetten */}
      <Sectie
        titel={`Stilliggende wetten (${m.stilliggend.length}${m.stilliggend.length === 25 ? "+" : ""})`}
        hint="Lopend, maar > 6 maanden geen activiteit en niets gepland."
      >
        {m.stilliggend.length === 0 ? (
          <p className="text-sm text-mute">Geen stilliggende wetten gevonden.</p>
        ) : (
          <ul className="divide-y divide-line/60 text-sm">
            {m.stilliggend.map(({ entry, laatste }) => (
              <li key={entry.wet.id} className="py-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/wet/${entry.wet.id}`}
                    className="text-ink hover:underline truncate min-w-0"
                  >
                    {entry.wet.titel}
                  </Link>
                  <span className="text-xs text-mute shrink-0">
                    {fmtDatum(laatste)}
                  </span>
                </div>
                <div className="text-xs text-mute">
                  {FASE_LABEL[entry.wet.fase]} · {entry.ministerie.afkorting}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sectie>
    </div>
  );
}
