"use client";

import { Children, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  initialCount?: number;
  /** Tekst voor de uitklap-knop. Krijgt het aantal verborgen items als arg. */
  meerLabel: (verborgen: number) => string;
  minderLabel?: string;
};

export function UitklapLijst({
  children,
  initialCount = 10,
  meerLabel,
  minderLabel = "Toon minder",
}: Props) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(false);

  if (items.length <= initialCount) {
    return <>{items}</>;
  }

  const zichtbaar = open ? items : items.slice(0, initialCount);
  const verborgen = items.length - initialCount;

  return (
    <>
      {zichtbaar}
      <li className="py-3 flex justify-center border-t border-line">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-mute hover:text-ink underline underline-offset-2 transition"
        >
          {open ? minderLabel : meerLabel(verborgen)}
        </button>
      </li>
    </>
  );
}
