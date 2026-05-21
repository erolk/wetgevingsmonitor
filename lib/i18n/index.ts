// De site is NL-only (de taalschakelaar is uit de header gehaald). We lezen
// daarom GEEN cookie meer: cookies() zou elke pagina dynamisch maken, waardoor
// alles live per request gerenderd wordt (traag). Door hier gewoon de NL-
// dictionary terug te geven kunnen pagina's statisch gegenereerd + via ISR
// gecached worden.
//
// De EN-dictionary (en.ts) blijft bestaan voor als de taalschakelaar later
// terugkomt; dan kan hier weer een cookie/locale-route worden ingelezen.

import { nl } from "./nl";
import type { Dictionary, Locale } from "./types";

export type { Dictionary, Locale };

export async function getDict(): Promise<{
  dict: Dictionary;
  locale: Locale;
}> {
  return { dict: nl, locale: "nl" };
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
