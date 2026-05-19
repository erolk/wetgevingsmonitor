// Server-side helper om de juiste dictionary op te halen op basis van een
// cookie `locale=nl|en`. Default = nl.
//
// Let op: `cookies()` maakt een Server Component dynamisch (geen statische
// generatie). Voor onze schaal (paar honderd wetten, dagelijks gecached
// fetched data) is dat acceptabel.

import { cookies } from "next/headers";
import { nl } from "./nl";
import { en } from "./en";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, Locale };

const DICTS: Record<Locale, Dictionary> = { nl, en };

export async function getDict(): Promise<{
  dict: Dictionary;
  locale: Locale;
}> {
  const store = await cookies();
  const raw = store.get("locale")?.value;
  const locale: Locale = raw === "en" ? "en" : "nl";
  return { dict: DICTS[locale], locale };
}

/** Vervang `{key}`-placeholders door waarden. */
export function tpl(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    template,
  );
}
