"use client";

import { Children, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  initialCount?: number;
  /**
   * Template voor de uitklap-knop tekst. Gebruik `{aantal}` als placeholder
   * voor het aantal verborgen items. Strings only (geen function-props),
   * want server→client componenten in Next.js App Router accepteren geen
   * function-props zonder "use server".
   */
  meerTemplate: string;
  minderLabel?: string;
};

export function UitklapLijst({
  children,
  initialCount = 10,
  meerTemplate,
  minderLabel = "Toon minder",
}: Props) {
  const items = Children.toArray(children);
  const [open, setOpen] = useState(false);

  if (items.length <= initialCount) {
    return <>{items}</>;
  }

  const zichtbaar = open ? items : items.slice(0, initialCount);
  const verborgen = items.length - initialCount;
  const meerLabel = meerTemplate.replace("{aantal}", String(verborgen));

  return (
    <>
      {zichtbaar}
      <li className="py-3 flex justify-center border-t border-line">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-sm text-mute hover:text-ink underline underline-offset-2 transition"
        >
          {open ? minderLabel : meerLabel}
        </button>
      </li>
    </>
  );
}
