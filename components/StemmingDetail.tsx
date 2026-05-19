"use client";

import { useState } from "react";
import type { StemUitslag, FractieStem } from "@/lib/stemming";
import type { Dictionary } from "@/lib/i18n/types";

type Props = {
  uitslag: StemUitslag;
  dict: Dictionary;
};

export function StemmingDetail({ uitslag, dict }: Props) {
  const { isHoofdelijk, voor, tegen, onthouden, nietDeelgenomen, perFractie } =
    uitslag;
  const t = dict.stemming;

  const uitkomst =
    voor > tegen ? t.accepted : tegen > voor ? t.rejected : t.tied;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">{uitkomst}</span>
        <span className="text-emerald-700 dark:text-emerald-300">
          {voor} {t.voor}
        </span>
        <span className="text-rose-700 dark:text-rose-300">
          {tegen} {t.tegen}
        </span>
        {onthouden > 0 && (
          <span className="text-mute">
            {onthouden} {t.onthouden}
          </span>
        )}
        {nietDeelgenomen > 0 && (
          <span className="text-mute">
            {nietDeelgenomen} {t.nietDeelgenomen}
          </span>
        )}
        <span className="text-xs text-mute">
          · {isHoofdelijk ? t.hoofdelijkLabel : t.fractieLabel}
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {perFractie.map((f) => (
          <FractieRij
            key={f.fractie}
            fractie={f}
            hoofdelijk={isHoofdelijk}
            dict={dict}
          />
        ))}
      </ul>
    </div>
  );
}

function FractieRij({
  fractie,
  hoofdelijk,
  dict,
}: {
  fractie: FractieStem;
  hoofdelijk: boolean;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const heeftKamerleden = hoofdelijk && fractie.kamerleden.length > 0;
  const t = dict.stemming;

  return (
    <li className="rounded border border-line/60 bg-paper">
      <button
        type="button"
        onClick={() => heeftKamerleden && setOpen(!open)}
        disabled={!heeftKamerleden}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left ${
          heeftKamerleden ? "hover:bg-surface cursor-pointer" : "cursor-default"
        }`}
        aria-expanded={heeftKamerleden ? open : undefined}
      >
        <span className="font-medium truncate">{fractie.fractie}</span>
        <span className="flex items-center gap-2 shrink-0 text-xs">
          {fractie.voor > 0 && (
            <span className="text-emerald-700 dark:text-emerald-300">
              {fractie.voor} {t.voor}
            </span>
          )}
          {fractie.tegen > 0 && (
            <span className="text-rose-700 dark:text-rose-300">
              {fractie.tegen} {t.tegen}
            </span>
          )}
          {fractie.onthouden > 0 && (
            <span className="text-mute">{fractie.onthouden} onth.</span>
          )}
          {fractie.nietDeelgenomen > 0 && (
            <span className="text-mute">
              {fractie.nietDeelgenomen} n.d.
            </span>
          )}
          {heeftKamerleden && (
            <span
              aria-hidden
              className={`text-mute transition-transform ${open ? "rotate-90" : ""}`}
            >
              ›
            </span>
          )}
        </span>
      </button>
      {open && heeftKamerleden && (
        <ul className="border-t border-line/60 px-3 py-2 text-xs space-y-0.5">
          {fractie.kamerleden.map((k, i) => (
            <li
              key={`${k.naam}-${i}`}
              className="flex justify-between gap-2"
            >
              <span className="truncate">
                {k.naam}
                {k.vergissing && (
                  <span className="text-mute italic"> {t.mistake}</span>
                )}
              </span>
              <span
                className={
                  k.soort === "Voor"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : k.soort === "Tegen"
                      ? "text-rose-700 dark:text-rose-300"
                      : "text-mute"
                }
              >
                {k.soort === "Voor"
                  ? t.voor
                  : k.soort === "Tegen"
                    ? t.tegen
                    : k.soort === "Onthouden"
                      ? t.onthouden
                      : t.nietDeelgenomen}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
