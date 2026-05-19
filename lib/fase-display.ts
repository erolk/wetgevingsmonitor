// Display-constanten voor wetgevings-fases. Bewust apart van tk-api.ts zodat
// client components deze kunnen importeren zonder server-only dependencies
// (fs/path) mee te krijgen.

import type { Fase } from "./types";

export const FASE_LABEL: Record<Fase, string> = {
  ingediend: "Ingediend",
  in_commissie: "In behandeling (TK-commissie)",
  plenair_tk: "Plenair Tweede Kamer",
  stemming_tk: "Stemming Tweede Kamer",
  aangenomen_tk: "Aangenomen door Tweede Kamer",
  in_eerste_kamer: "In behandeling Eerste Kamer",
  aangenomen_ek: "Aangenomen door Eerste Kamer",
  wet: "Wet (in werking / afgedaan)",
  verworpen: "Verworpen",
  ingetrokken: "Ingetrokken",
  onbekend: "Onbekend",
};

export const FASE_KLEUR: Record<Fase, string> = {
  ingediend:
    "bg-slate-200 text-slate-800 dark:bg-slate-700/60 dark:text-slate-200",
  in_commissie:
    "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
  plenair_tk:
    "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
  stemming_tk:
    "bg-blue-200 text-blue-900 dark:bg-blue-800/40 dark:text-blue-100",
  aangenomen_tk:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  in_eerste_kamer:
    "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200",
  aangenomen_ek:
    "bg-emerald-200 text-emerald-900 dark:bg-emerald-800/40 dark:text-emerald-100",
  wet: "bg-green-200 text-green-900 dark:bg-green-800/40 dark:text-green-100",
  verworpen:
    "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-200",
  ingetrokken:
    "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300",
  onbekend:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300",
};
