import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchWetsvoorstellenVoorCommissie,
  normalize,
  FASE_LABEL,
  FASE_KLEUR,
} from "@/lib/tk-api";
import type { Fase, WetVoorstel } from "@/lib/types";
import { getMinisterie, MINISTERIES } from "@/lib/ministeries";
import { getUitleg } from "@/lib/explanations";
import { SubscribeButton } from "@/components/SubscribeButton";
import { UitklapLijst } from "@/components/UitklapLijst";

export const revalidate = 86400;

export function generateStaticParams() {
  return MINISTERIES.map((m) => ({ slug: m.slug }));
}

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fase?: string }>;
};

const FILTER_OPTIES: Array<{ id: string; label: string; matchFases: Fase[] }> =
  [
    {
      id: "in-commissie",
      label: "In commissie TK",
      matchFases: ["ingediend", "in_commissie"],
    },
    {
      id: "plenair-tk",
      label: "Plenair / stemming TK",
      matchFases: ["plenair_tk", "stemming_tk"],
    },
    {
      id: "aangenomen-tk",
      label: "Aangenomen door TK",
      matchFases: ["aangenomen_tk"],
    },
    {
      id: "eerste-kamer",
      label: "In Eerste Kamer",
      matchFases: ["in_eerste_kamer", "aangenomen_ek"],
    },
    {
      id: "wet",
      label: "Wet (Staatsblad)",
      matchFases: ["wet"],
    },
    {
      id: "verworpen",
      label: "Verworpen / ingetrokken",
      matchFases: ["verworpen", "ingetrokken"],
    },
  ];

export default async function MinisterieOverview({
  params,
  searchParams,
}: Params) {
  const { slug } = await params;
  const sp = await searchParams;
  const actieveFilter = sp.fase ?? null;
  const m = getMinisterie(slug);
  if (!m) notFound();

  let items: WetVoorstel[] = [];
  let error: string | null = null;
  try {
    const zaken = await fetchWetsvoorstellenVoorCommissie(m.commissie, 200);
    items = zaken.map(normalize);
  } catch (e) {
    error = e instanceof Error ? e.message : "Onbekende fout";
  }

  // Filter toepassen indien actief
  const filterOpt = FILTER_OPTIES.find((f) => f.id === actieveFilter) ?? null;
  const gefilterd = filterOpt
    ? items.filter((i) => filterOpt.matchFases.includes(i.fase))
    : items;

  const lopend = gefilterd.filter(
    (i) => !i.afgedaan && i.fase !== "verworpen" && i.fase !== "ingetrokken",
  );
  const afgerond = gefilterd.filter(
    (i) => i.afgedaan || i.fase === "verworpen" || i.fase === "ingetrokken",
  );

  // Tellingen per filter-optie voor in de chips
  const tellingen: Record<string, number> = {};
  for (const opt of FILTER_OPTIES) {
    tellingen[opt.id] = items.filter((i) =>
      opt.matchFases.includes(i.fase),
    ).length;
  }

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
      >
        ← alle ministeries
      </Link>

      <section className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <header>
          <div className="text-xs text-mute uppercase tracking-wider mb-1">
            Ministerie · {m.afkorting}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl tracking-tight leading-tight break-words">
            {m.naam}
          </h1>
          <p className="mt-3 max-w-2xl text-mute">{m.beschrijving}</p>
        </header>
        <aside className="rounded-md border border-line bg-surface p-3 sm:w-64 sm:shrink-0">
          <SubscribeButton
            target="ministerie"
            slug={m.slug}
            naam={m.naam}
            compact
          />
          <p className="mt-2 text-[11px] text-mute leading-relaxed">
            Mail bij elk debat, stemming of besluit op een wet van dit
            ministerie.
          </p>
        </aside>
      </section>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          Kon data niet ophalen: {error}
        </div>
      )}

      <FaseStrip
        slug={m.slug}
        items={items}
        tellingen={tellingen}
        actieveFilter={actieveFilter}
      />

      <section>
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="font-serif text-2xl">
            Lopende wetsvoorstellen{" "}
            <span className="text-mute text-base">({lopend.length})</span>
          </h2>
          <Link
            href="/proces"
            className="text-xs text-mute hover:text-ink underline"
          >
            wat betekenen de fases?
          </Link>
        </div>
        <ul className="divide-y divide-line border-t border-b border-line">
          {lopend.map((it) => (
            <WetRow key={it.id} item={it} />
          ))}
          {lopend.length === 0 && !error && (
            <li className="py-6 text-sm text-mute">
              {actieveFilter
                ? "Geen wetten in deze fase voor dit ministerie."
                : "Op dit moment geen lopende wetsvoorstellen gevonden voor dit ministerie."}
            </li>
          )}
        </ul>
      </section>

      {afgerond.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl mb-4">
            Afgerond / verworpen{" "}
            <span className="text-mute text-base">({afgerond.length})</span>
          </h2>
          <ul className="divide-y divide-line border-t border-b border-line">
            <UitklapLijst
              initialCount={10}
              meerTemplate="Toon overige {aantal} wetsvoorstellen ↓"
              minderLabel="Toon minder ↑"
            >
              {afgerond.map((it) => (
                <WetRow key={it.id} item={it} />
              ))}
            </UitklapLijst>
          </ul>
        </section>
      )}
    </div>
  );
}

function FaseStrip({
  slug,
  items,
  tellingen,
  actieveFilter,
}: {
  slug: string;
  items: WetVoorstel[];
  tellingen: Record<string, number>;
  actieveFilter: string | null;
}) {
  return (
    <section aria-label="Filter op fase">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        <FaseTegel
          href={`/ministerie/${slug}`}
          actief={!actieveFilter}
          aantal={items.length}
          label="Alles"
          alwaysClickable
        />
        {FILTER_OPTIES.map((opt) => {
          const aantal = tellingen[opt.id] ?? 0;
          const actief = actieveFilter === opt.id;
          const href = actief
            ? `/ministerie/${slug}`
            : `/ministerie/${slug}?fase=${opt.id}`;
          return (
            <FaseTegel
              key={opt.id}
              href={href}
              actief={actief}
              aantal={aantal}
              label={opt.label}
            />
          );
        })}
      </div>
    </section>
  );
}

function FaseTegel({
  href,
  actief,
  aantal,
  label,
  alwaysClickable,
}: {
  href: string;
  actief: boolean;
  aantal: number;
  label: string;
  alwaysClickable?: boolean;
}) {
  const disabled = !alwaysClickable && aantal === 0 && !actief;
  const base =
    "block rounded-md border px-3 py-3 transition select-none";
  const state = actief
    ? "bg-ink text-paper border-ink"
    : disabled
      ? "bg-surface/60 border-line text-mute/40 pointer-events-none"
      : "bg-surface border-line hover:border-ink text-ink";
  return (
    <Link href={href} className={`${base} ${state}`}>
      <div className="text-2xl font-serif leading-none">{aantal}</div>
      <div
        className={`text-[11px] uppercase tracking-wide mt-1 leading-tight ${
          actief ? "text-paper/80" : "text-mute"
        }`}
      >
        {label}
      </div>
    </Link>
  );
}

function WetRow({ item }: { item: WetVoorstel }) {
  const datum = item.volgendeActiviteit?.datum;
  const uitleg = getUitleg(item.id);
  return (
    <li className="py-5">
      <Link href={`/wet/${item.id}`} className="block group">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-mute mb-1">
              <span className="font-mono">{item.nummer}</span>
              {item.dossierNummer && (
                <>
                  <span>·</span>
                  <span>dossier {item.dossierNummer}</span>
                </>
              )}
              {item.gestartOp && (
                <>
                  <span>·</span>
                  <span>ingediend {formatDate(item.gestartOp)}</span>
                </>
              )}
            </div>
            <div className="font-medium leading-snug group-hover:underline">
              {item.titel}
            </div>
            {uitleg && (
              <div className="mt-2 text-sm text-ink/80 leading-relaxed">
                <span className="font-medium">{uitleg.watRegelt}</span>{" "}
                <span className="text-mute">{uitleg.raaktJou}</span>
              </div>
            )}
            {item.volgendeActiviteit && (
              <div className="mt-2 text-xs text-mute">
                <span className="text-ink/80 font-medium">Volgende moment:</span>{" "}
                {item.volgendeActiviteit.soort ?? "Activiteit"}
                {datum ? ` — ${formatDate(datum)}` : ""}
                {item.volgendeActiviteit.status
                  ? ` (${item.volgendeActiviteit.status})`
                  : ""}
              </div>
            )}
          </div>
          <span
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${FASE_KLEUR[item.fase]}`}
          >
            {FASE_LABEL[item.fase]}
          </span>
        </div>
      </Link>
    </li>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
