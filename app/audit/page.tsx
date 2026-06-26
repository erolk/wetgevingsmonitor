import type { Metadata } from "next";
import Link from "next/link";
import { getAuditRapport, type AuditWet } from "@/lib/audit";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Audit: lopende wetgeving | Wetgevingsmonitor",
  description:
    "Vergelijking van lopende wetsvoorstellen op de Wetgevingsmonitor met de officiële lijst van de Tweede Kamer. Dekkingscijfer, missende wetten en status-consistentie.",
  robots: { index: false, follow: false },
};

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

function Stat({
  label,
  value,
  toon,
}: {
  label: string;
  value: number | string;
  toon: "ok" | "mid" | "nok" | "neutraal";
}) {
  const kleur =
    toon === "ok"
      ? "text-emerald-700"
      : toon === "mid"
        ? "text-amber-700"
        : toon === "nok"
          ? "text-rose-700"
          : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-surface px-5 py-5">
      <div className={`font-serif text-4xl leading-none ${kleur}`}>
        {value}
      </div>
      <div className="mt-2 text-xs text-mute leading-snug">{label}</div>
    </div>
  );
}

function WetRij({ w }: { w: AuditWet }) {
  const titel = w.korteNaam ?? w.titel;
  return (
    <li className="py-3 border-b border-line/40 last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-mute mb-1">
        <span className="font-mono">{w.nummer}</span>
        {w.gestartOp && (
          <>
            <span>·</span>
            <span>ingediend {fmtDatum(w.gestartOp)}</span>
          </>
        )}
        <span className="ml-auto">
          <a
            href={`https://www.tweedekamer.nl/kamerstukken/wetsvoorstellen/detail?qry=wetsvoorstel%3A${encodeURIComponent(w.nummer)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            TK-site →
          </a>
        </span>
      </div>
      <Link
        href={`/wet/${w.id}`}
        className="text-sm text-ink hover:underline leading-snug"
      >
        {titel}
      </Link>
      {w.reden && (
        <p className="mt-1 text-xs text-mute italic">{w.reden}</p>
      )}
    </li>
  );
}

export default async function AuditPagina() {
  const r = getAuditRapport();

  if (!r) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="font-serif text-3xl">Audit: lopende wetgeving</h1>
        <p className="text-mute">
          Het audit-rapport is nog niet gegenereerd. Draai eenmalig{" "}
          <code className="text-ink">npm run audit-wetgeving</code> (of wacht op
          de wekelijkse maandag-Action).
        </p>
      </div>
    );
  }

  const missendTotaal = r.missend.geenVoortouw + r.missend.andereCommissie;

  return (
    <div className="space-y-10">
      {/* Kop */}
      <section>
        <p className="text-xs font-mono uppercase tracking-wider text-accent">
          Monitor
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight mt-1">
          Audit: lopende wetgeving
        </h1>
        <p className="mt-3 text-mute leading-relaxed max-w-2xl">
          Live vergelijking van alle lopende wetsvoorstellen die de Tweede
          Kamer in haar open data publiceert met wat er op de Wetgevingsmonitor
          staat. Dit is exact dezelfde bron die{" "}
          <a
            href="https://www.tweedekamer.nl/kamerstukken/wetsvoorstellen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            tweedekamer.nl/kamerstukken/wetsvoorstellen
          </a>{" "}
          gebruikt.
        </p>
        <p className="mt-2 text-xs text-mute">
          Laatste audit: {fmtDatumTijd(r.bijgewerkt)} · ververst wekelijks via
          een automatische job (maandag 06:00 UTC).
        </p>
      </section>

      {/* Eindresultaat — 4 kerncijfers groot */}
      <section>
        <h2 className="font-serif text-xl mb-3">Eindresultaat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            label="Aantal lopende wetten op de TK-site"
            value={r.lopendTk.toLocaleString("nl-NL")}
            toon="neutraal"
          />
          <Stat
            label="Aantal wetten op de Wetgevingsmonitor"
            value={r.opMonitor.toLocaleString("nl-NL")}
            toon="ok"
          />
          <Stat
            label="Wetsvoorstellen met status-mismatch"
            value={r.mismatchesAantal.toLocaleString("nl-NL")}
            toon={r.mismatchesAantal === 0 ? "ok" : "nok"}
          />
          <Stat
            label="Wetsvoorstellen die missen op de monitor"
            value={missendTotaal.toLocaleString("nl-NL")}
            toon={
              missendTotaal === 0 ? "ok" : missendTotaal < 15 ? "mid" : "nok"
            }
          />
        </div>
        <p className="mt-3 text-xs text-mute">
          Dekking: <strong className="text-ink">{r.dekking.toFixed(1)}%</strong>{" "}
          van alle lopende wetgeving uit TK Open Data is zichtbaar op de
          Wetgevingsmonitor.
        </p>
      </section>

      {/* Wetten met status-mismatch */}
      <section>
        <h2 className="font-serif text-2xl mb-2">
          Wetsvoorstellen met status-mismatch
        </h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          Wetten waarvan de status binnen TK Open Data zelf intern
          inconsistent is — bijvoorbeeld een eindbesluit
          &laquo;Aangenomen&raquo; terwijl de zaak nog niet als afgedaan
          gemarkeerd staat. Geen mismatch hier = de Wetgevingsmonitor toont
          de status conform de bron.
        </p>
        {r.mismatches.length === 0 ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            ✓ Geen mismatches. De fase van iedere lopende wet op de
            Wetgevingsmonitor komt overeen met wat de TK in haar open data
            publiceert.
          </div>
        ) : (
          <ul className="rounded-lg border border-line bg-surface px-4">
            {r.mismatches.map((w) => (
              <WetRij key={w.id} w={w} />
            ))}
          </ul>
        )}
      </section>

      {/* Wetten die missen */}
      <section>
        <h2 className="font-serif text-2xl mb-2">
          Wetsvoorstellen die missen op de Wetgevingsmonitor
        </h2>
        <p className="text-sm text-mute mb-4 max-w-2xl">
          Lopende wetten die wél in TK Open Data staan maar niet op de
          Wetgevingsmonitor verschijnen. Reden: of het voorstel zit in een
          vroeg stadium (nog geen vaste kamercommissie toegewezen), of het ligt
          bij een commissie die niet aan een van onze 15 ministeries gekoppeld
          is (bijv. vaste commissie voor Digitale Zaken).
        </p>
        {missendTotaal === 0 ? (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            ✓ Geen ontbrekende wetten — 100% dekking.
          </div>
        ) : (
          <ul className="rounded-lg border border-line bg-surface px-4">
            {r.missendeWetten.map((w) => (
              <WetRij key={w.id} w={w} />
            ))}
          </ul>
        )}
      </section>

      {/* Verantwoording */}
      <section className="border-t border-line pt-6 text-xs text-mute space-y-2">
        <p>
          <strong className="text-ink">Verantwoording.</strong> De gegevens
          komen uit de officiële{" "}
          <a
            href="https://opendata.tweedekamer.nl/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Tweede Kamer Open Data
          </a>
          . &laquo;Lopend&raquo; betekent dat de Tweede Kamer de zaak nog niet
          als afgedaan heeft gemarkeerd, of dat de Eerste Kamer nog bezig is.
          Audit wordt automatisch ververst op maandag 06:00 UTC; je ziet hier
          altijd de meest recente run.
        </p>
        <p>Deze website is geen officiële website van de Rijksoverheid.</p>
      </section>
    </div>
  );
}
