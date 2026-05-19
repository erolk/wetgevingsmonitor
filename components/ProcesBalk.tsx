import { PROCES_STAPPEN, stapStatussen, type StapStatus } from "@/lib/proces";
import type { Fase } from "@/lib/types";

type Props = {
  fase: Fase;
  compact?: boolean;
};

export function ProcesBalk({ fase, compact = false }: Props) {
  const statussen = stapStatussen(fase);
  const verworpen = fase === "verworpen" || fase === "ingetrokken";

  return (
    <div className="w-full">
      {/* Desktop (≥lg) / horizontale variant met hover-tooltip.
          Grid-cols-8 zorgt dat elke bolletje precies in het midden van zijn
          kolom zit; connector-lines lopen tussen aangrenzende kolommen door
          via absolute positionering (geen 'last item shifts right' meer). */}
      <ol className="hidden lg:grid grid-cols-8 items-start">
        {PROCES_STAPPEN.map((stap, i) => {
          const status = statussen[i];
          const vorigeVoltooid = i > 0 && statussen[i - 1] === "voltooid";
          const dezeVoltooid = status === "voltooid";
          const isEerste = i === 0;
          const isLaatste = i === PROCES_STAPPEN.length - 1;
          return (
            <li
              key={stap.id}
              className="flex flex-col items-center px-1 group relative"
              aria-current={status === "bezig" ? "step" : undefined}
            >
              {/* Connector-segmenten van de kolom-rand tot net voor het bolletje.
                  top-[9px] matcht de verticale midden van de h-5 (20px) bolletje.
                  De inset (calc(50% - 14px)) zorgt voor een kleine adempauze
                  tussen de lijn en de bolletje (20px breed + 2x2px border = 24px,
                  dus 12px aan elke kant + 2px gap). */}
              {!isEerste && (
                <div
                  className={`absolute top-[9px] left-0 right-[calc(50%+14px)] h-px ${
                    vorigeVoltooid || dezeVoltooid
                      ? "bg-accent/60"
                      : "bg-line"
                  }`}
                  aria-hidden="true"
                />
              )}
              {!isLaatste && (
                <div
                  className={`absolute top-[9px] left-[calc(50%+14px)] right-0 h-px ${
                    dezeVoltooid || statussen[i + 1] === "voltooid"
                      ? "bg-accent/60"
                      : "bg-line"
                  }`}
                  aria-hidden="true"
                />
              )}
              <Bolletje status={status} verworpen={verworpen} />
              <div
                className={`mt-2 text-[11px] text-center leading-tight ${
                  status === "bezig"
                    ? "font-semibold text-ink"
                    : status === "voltooid"
                      ? "text-ink/80"
                      : "text-mute"
                }`}
              >
                {stap.korteNaam}
              </div>
              {!compact && (
                <div
                  className="hidden group-hover:block group-focus-within:block absolute top-full mt-2 z-20 bg-ink text-paper text-xs rounded p-3 w-64 shadow-lg pointer-events-none"
                  role="tooltip"
                >
                  <div className="font-medium mb-1">{stap.volledigeNaam}</div>
                  <div className="text-paper/80 leading-relaxed">
                    {stap.uitleg}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile / tablet — verticale variant met inline uitleg (werkt op touch) */}
      <ol className="lg:hidden space-y-2">
        {PROCES_STAPPEN.map((stap, i) => {
          const status = statussen[i];
          return (
            <li key={stap.id} className="flex gap-3 items-start">
              <Bolletje status={status} verworpen={verworpen} />
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm leading-snug ${
                    status === "bezig"
                      ? "font-semibold text-ink"
                      : status === "voltooid"
                        ? "text-ink/80"
                        : "text-mute"
                  }`}
                >
                  {stap.volledigeNaam}
                  {status === "bezig" && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-accent">
                      huidig
                    </span>
                  )}
                </div>
                {!compact && (
                  <div className="text-xs text-mute mt-0.5 leading-relaxed">
                    {stap.uitleg}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Bolletje({
  status,
  verworpen,
}: {
  status: StapStatus;
  verworpen: boolean;
}) {
  const base =
    "shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px]";
  if (status === "voltooid") {
    return (
      <span className={`${base} bg-accent border-accent text-white`}>✓</span>
    );
  }
  if (status === "bezig") {
    return (
      <span
        className={`${base} bg-paper border-accent text-accent animate-pulse`}
      >
        ●
      </span>
    );
  }
  if (status === "overgeslagen") {
    return (
      <span
        className={`${base} bg-zinc-100 border-zinc-300 text-mute dark:bg-zinc-800/60 dark:border-zinc-600`}
      >
        {verworpen ? "✕" : "—"}
      </span>
    );
  }
  return <span className={`${base} bg-paper border-line text-mute`}>○</span>;
}
