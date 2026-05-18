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
      {/* Desktop (≥lg) / horizontale variant met hover-tooltip */}
      <ol className="hidden lg:flex items-stretch gap-0">
        {PROCES_STAPPEN.map((stap, i) => {
          const status = statussen[i];
          const isLaatste = i === PROCES_STAPPEN.length - 1;
          return (
            <li
              key={stap.id}
              className="flex-1 flex items-center"
              aria-current={status === "bezig" ? "step" : undefined}
            >
              <div className="flex flex-col items-center flex-1 px-1 group relative">
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
                    className="hidden group-hover:block group-focus-within:block absolute top-full mt-2 z-10 bg-ink text-paper text-xs rounded p-3 w-64 shadow-lg pointer-events-none"
                    role="tooltip"
                  >
                    <div className="font-medium mb-1">
                      {stap.volledigeNaam}
                    </div>
                    <div className="text-paper/80 leading-relaxed">
                      {stap.uitleg}
                    </div>
                  </div>
                )}
              </div>
              {!isLaatste && (
                <div
                  className={`h-px flex-1 ${
                    statussen[i + 1] === "voltooid" || statussen[i] === "voltooid"
                      ? "bg-accent/60"
                      : "bg-line"
                  }`}
                  aria-hidden="true"
                />
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
