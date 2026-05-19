"use client";

import { useState } from "react";
import type { StemUitslag, FractieStem } from "@/lib/stemming";

type Props = {
  uitslag: StemUitslag;
};

export function StemmingDetail({ uitslag }: Props) {
  const { isHoofdelijk, voor, tegen, onthouden, nietDeelgenomen, perFractie } =
    uitslag;

  const uitkomst =
    voor > tegen
      ? "Aangenomen"
      : tegen > voor
        ? "Verworpen"
        : "Staken der stemmen";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="font-medium">{uitkomst}</span>
        <span className="text-emerald-700 dark:text-emerald-300">
          {voor} voor
        </span>
        <span className="text-rose-700 dark:text-rose-300">{tegen} tegen</span>
        {onthouden > 0 && (
          <span className="text-mute">{onthouden} onthouden</span>
        )}
        {nietDeelgenomen > 0 && (
          <span className="text-mute">{nietDeelgenomen} niet deelgenomen</span>
        )}
        <span className="text-xs text-mute">
          ·{" "}
          {isHoofdelijk
            ? "Hoofdelijke stemming (elk Kamerlid stemt apart)"
            : "Stemming bij zitten en opstaan (per fractie)"}
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {perFractie.map((f) => (
          <FractieRij key={f.fractie} fractie={f} hoofdelijk={isHoofdelijk} />
        ))}
      </ul>
    </div>
  );
}

function FractieRij({
  fractie,
  hoofdelijk,
}: {
  fractie: FractieStem;
  hoofdelijk: boolean;
}) {
  const [open, setOpen] = useState(false);
  const heeftKamerleden = hoofdelijk && fractie.kamerleden.length > 0;

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
              {fractie.voor} voor
            </span>
          )}
          {fractie.tegen > 0 && (
            <span className="text-rose-700 dark:text-rose-300">
              {fractie.tegen} tegen
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
                  <span className="text-mute italic"> (vergissing)</span>
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
                {k.soort}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
