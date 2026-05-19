"use client";

import { useState } from "react";
import { StemmingDetail } from "./StemmingDetail";
import type { StemUitslag } from "@/lib/stemming";
import type { Dictionary, Locale } from "@/lib/i18n/types";

export type BesluitWeergave = {
  id: string;
  besluitSoort: string | null;
  stemmingsSoort: string | null;
  besluitTekst: string | null;
  status: string | null;
  gewijzigdOp: string | null;
  uitslag: StemUitslag | null;
};

type Props = {
  stemmingen: BesluitWeergave[];
  procedureel: BesluitWeergave[];
  dict: Dictionary;
  locale: Locale;
};

export function BesluitenLijst({
  stemmingen,
  procedureel,
  dict,
  locale,
}: Props) {
  const [procOpen, setProcOpen] = useState(false);
  const t = dict.wet;

  return (
    <div className="space-y-4">
      {stemmingen.length === 0 && procedureel.length === 0 && (
        <p className="text-sm text-mute">{t.decisionsEmpty}</p>
      )}

      {stemmingen.length > 0 && (
        <ul className="space-y-4">
          {stemmingen.map((b) => (
            <li
              key={b.id}
              className="rounded-md border border-line bg-surface p-4 space-y-3"
            >
              <div className="space-y-1">
                <div className="text-xs text-mute">
                  {formatDate(b.gewijzigdOp, locale)}
                  {b.status ? ` · ${b.status}` : ""}
                </div>
                <div className="font-medium">
                  {b.besluitTekst ??
                    b.besluitSoort ??
                    b.stemmingsSoort ??
                    dict.stemming.accepted}
                </div>
                {b.besluitTekst && b.besluitSoort && (
                  <div className="text-xs text-mute">{b.besluitSoort}</div>
                )}
              </div>
              {b.uitslag && (
                <StemmingDetail uitslag={b.uitslag} dict={dict} />
              )}
            </li>
          ))}
        </ul>
      )}

      {procedureel.length > 0 && (
        <div className="rounded-md border border-line/60 bg-surface/50">
          <button
            type="button"
            onClick={() => setProcOpen(!procOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-mute hover:text-ink transition"
            aria-expanded={procOpen}
          >
            <span>
              {procOpen
                ? t.hideProcedural.replace("{n}", String(procedureel.length))
                : t.showProcedural.replace("{n}", String(procedureel.length))}
            </span>
            <span
              aria-hidden
              className={`transition-transform ${procOpen ? "rotate-90" : ""}`}
            >
              ›
            </span>
          </button>
          {procOpen && (
            <ul className="border-t border-line/60 divide-y divide-line/60">
              {procedureel.map((b) => (
                <li key={b.id} className="px-4 py-3 space-y-1">
                  <div className="text-xs text-mute">
                    {formatDate(b.gewijzigdOp, locale)}
                    {b.besluitSoort ? ` · ${b.besluitSoort}` : ""}
                  </div>
                  {b.besluitTekst && (
                    <div className="text-sm">{b.besluitTekst}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null | undefined, locale: Locale): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(
      locale === "en" ? "en-GB" : "nl-NL",
      { day: "numeric", month: "long", year: "numeric" },
    );
  } catch {
    return iso;
  }
}
