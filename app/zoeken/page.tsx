"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FASE_KLEUR, FASE_LABEL } from "@/lib/fase-display";
import type { Fase } from "@/lib/types";
import type { ZoekItem } from "@/lib/zoek-types";

const SUGGESTIES = [
  "asiel",
  "huur",
  "klimaat",
  "zorg",
  "pensioen",
  "stikstof",
  "AOW",
  "onderwijs",
];

export default function ZoekPagina() {
  const [index, setIndex] = useState<ZoekItem[] | null>(null);
  const [opgehaaldOp, setOpgehaaldOp] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/zoek")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setIndex(d.items as ZoekItem[]);
        setOpgehaaldOp(d.opgehaaldOp);
      })
      .catch((e) => setFout(e.message ?? "Kon zoek-index niet laden"));
  }, []);

  useEffect(() => {
    // Focus de input meteen, lees ?q= uit de URL
    const url = new URL(window.location.href);
    const q = url.searchParams.get("q");
    if (q) setQuery(q);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Schrijf de query naar de URL zonder reload (voor delen/back-button)
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url.toString());
  }, [query]);

  const resultaten = useMemo(() => {
    if (!index) return [];
    const woorden = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    if (woorden.length === 0) return [];

    type Scored = { item: ZoekItem; score: number };
    const scored: Scored[] = [];
    for (const item of index) {
      const titel = item.titel.toLowerCase();
      const onderwerp = item.onderwerp.toLowerCase();
      const uitleg = (item.uitlegTekst ?? "").toLowerCase();
      const voorWie = (item.voorWie ?? []).join(" ").toLowerCase();
      const minNaam = item.ministerie.korteNaam.toLowerCase();

      let score = 0;
      let allesGevonden = true;
      for (const w of woorden) {
        const inTitel = titel.includes(w);
        const inOnderwerp = onderwerp.includes(w);
        const inUitleg = uitleg.includes(w);
        const inVoorWie = voorWie.includes(w);
        const inMin = minNaam.includes(w);
        const hit = inTitel || inOnderwerp || inUitleg || inVoorWie || inMin;
        if (!hit) {
          allesGevonden = false;
          break;
        }
        if (inTitel) score += 10;
        if (inOnderwerp) score += 5;
        if (inUitleg) score += 4;
        if (inVoorWie) score += 3;
        if (inMin) score += 2;
      }
      if (allesGevonden) scored.push({ item, score });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aD = a.item.gestartOp ? new Date(a.item.gestartOp).getTime() : 0;
      const bD = b.item.gestartOp ? new Date(b.item.gestartOp).getTime() : 0;
      return bD - aD;
    });
    return scored.slice(0, 100).map((s) => s.item);
  }, [index, query]);

  const woordenVoorHighlight = useMemo(
    () =>
      query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 2),
    [query],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl tracking-tight leading-tight">
          Zoek in alle wetsvoorstellen
        </h1>
        <p className="mt-2 text-sm text-mute max-w-2xl">
          Doorzoekt alle ministeries tegelijk — op titel, onderwerp én op de
          burger-uitleg. Tip: zoek bijvoorbeeld op {""}
          {SUGGESTIES.slice(0, 4).map((s, i) => (
            <span key={s}>
              <button
                onClick={() => setQuery(s)}
                className="underline hover:text-ink"
              >
                {s}
              </button>
              {i < 3 ? ", " : ""}
            </span>
          ))}
          .
        </p>
      </div>

      <div className="relative">
        <span
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bv. asiel, huur, klimaat, eigen risico…"
          className="w-full rounded-lg border border-line bg-surface pl-11 pr-4 py-3 text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {fout && (
        <div className="rounded-md border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-4 text-sm text-rose-900 dark:text-rose-200">
          Kon zoek-data niet laden: {fout}
        </div>
      )}

      {!index && !fout && (
        <div className="text-sm text-mute">Zoek-index aan het laden…</div>
      )}

      {index && query.trim().length === 0 && (
        <div className="text-sm text-mute space-y-3">
          <p>
            {index.length} wetten doorzoekbaar, opgehaald{" "}
            {opgehaaldOp
              ? new Date(opgehaaldOp).toLocaleString("nl-NL", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
            .
          </p>
          <div className="flex flex-wrap gap-2">
            <span>Probeer:</span>
            {SUGGESTIES.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full border border-line bg-surface px-3 py-1 text-xs hover:border-ink hover:text-ink transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {index && query.trim().length > 0 && (
        <div className="text-sm text-mute">
          {resultaten.length === 0
            ? `Geen wetten gevonden voor "${query}". Probeer een andere term.`
            : `${resultaten.length} ${resultaten.length === 1 ? "wet" : "wetten"} gevonden`}
        </div>
      )}

      {resultaten.length > 0 && (
        <ul className="divide-y divide-line border-t border-b border-line">
          {resultaten.map((it) => (
            <Resultaat
              key={it.id}
              item={it}
              woordenVoorHighlight={woordenVoorHighlight}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Resultaat({
  item,
  woordenVoorHighlight,
}: {
  item: ZoekItem;
  woordenVoorHighlight: string[];
}) {
  return (
    <li className="py-5">
      <Link href={`/wet/${item.id}`} className="block group">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-mute mb-1 flex-wrap">
              <Link
                href={`/ministerie/${item.ministerie.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="font-mono uppercase tracking-wider hover:text-ink"
              >
                {item.ministerie.afkorting}
              </Link>
              <span>·</span>
              <span>{item.nummer}</span>
              {item.gestartOp && (
                <>
                  <span>·</span>
                  <span>ingediend {formatDate(item.gestartOp)}</span>
                </>
              )}
            </div>
            <div className="font-medium leading-snug group-hover:underline">
              {highlight(item.titel, woordenVoorHighlight)}
            </div>
            {item.uitlegTekst && (
              <div className="mt-1.5 text-sm text-ink/80 leading-relaxed line-clamp-2">
                {highlight(item.uitlegTekst, woordenVoorHighlight)}
              </div>
            )}
          </div>
          <span
            className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${FASE_KLEUR[item.fase as Fase]}`}
          >
            {FASE_LABEL[item.fase as Fase]}
          </span>
        </div>
      </Link>
    </li>
  );
}

function highlight(tekst: string, woorden: string[]) {
  if (woorden.length === 0) return tekst;
  // Bouw één regex voor alle woorden (case-insensitive, escape special chars)
  const escaped = woorden
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(`(${escaped})`, "gi");
  const parts = tekst.split(re);
  return (
    <>
      {parts.map((p, i) =>
        re.test(p) && woorden.includes(p.toLowerCase()) ? (
          <mark
            key={i}
            className="bg-accent/20 text-ink rounded-sm px-0.5"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function formatDate(iso: string): string {
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
