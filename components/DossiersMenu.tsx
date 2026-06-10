"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Header-dropdown "Dossiers" met daaronder de thematische monitor-pagina's.
// Sluit op klik buiten + Escape. Trigger toont een chevron die meedraait.

type Item = { href: string; titel: string; omschrijving: string };

const ITEMS: Item[] = [
  {
    href: "/migratiepact",
    titel: "Migratiepact",
    omschrijving: "EU-pact, uitvoeringswet en stemmingen per partij.",
  },
  {
    href: "/woningbouw",
    titel: "Woningbouw",
    omschrijving: "Nieuwbouw per provincie sinds 2024 + de 30%-norm.",
  },
];

export function DossiersMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="hover:text-ink inline-flex items-center gap-1"
      >
        Dossiers
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4.5l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-64 rounded-md border border-line bg-surface shadow-lg z-50"
        >
          <ul className="py-1.5 text-sm">
            {ITEMS.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  onClick={() => setOpen(false)}
                  role="menuitem"
                  className="block px-3 py-2 hover:bg-paper transition-colors"
                >
                  <div className="font-medium text-ink">{it.titel}</div>
                  <div className="mt-0.5 text-xs text-mute leading-snug">
                    {it.omschrijving}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
