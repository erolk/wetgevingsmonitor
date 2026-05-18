import Link from "next/link";
import { PROCES_STAPPEN } from "@/lib/proces";
import { ProcesBalk } from "@/components/ProcesBalk";

export const metadata = {
  title: "Hoe wordt een wet gemaakt? — Wetgevingsmonitor",
  description:
    "In acht stappen door het Nederlandse wetgevingsproces: van ministerie en Raad van State tot Tweede Kamer, Eerste Kamer en Staatsblad.",
};

export default function ProcesPagina() {
  return (
    <article className="space-y-12">
      <header className="space-y-4 max-w-2xl">
        <Link
          href="/"
          className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
        >
          ← terug
        </Link>
        <h1 className="font-serif text-4xl tracking-tight leading-tight">
          Hoe wordt een wet gemaakt?
        </h1>
        <p className="text-mute leading-relaxed">
          Een wetsvoorstel doorloopt acht stappen voordat het echt &quot;wet&quot;
          wordt. Sommige stappen duren weken, andere maanden of jaren. Bij elke
          wet op deze site zie je in welke stap die zich nu bevindt.
        </p>
      </header>

      <section className="rounded-md border border-line bg-surface p-6">
        <ProcesBalk fase="plenair_tk" compact />
        <p className="text-xs text-mute mt-4">
          Voorbeeld: een wet die nu in een plenair debat in de Tweede Kamer
          ligt. Voltooide stappen hebben een vinkje, de huidige stap pulseert
          rood, toekomstige stappen zijn open cirkels.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-6">De acht stappen</h2>
        <ol className="space-y-6">
          {PROCES_STAPPEN.map((stap, i) => (
            <li
              key={stap.id}
              className="grid grid-cols-[auto_1fr] gap-4 items-start"
            >
              <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-serif text-base shrink-0">
                {i + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h3 className="font-serif text-xl">{stap.volledigeNaam}</h3>
                  <span className="text-xs uppercase tracking-wider text-mute">
                    waar: {stap.waar}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink/80">
                  {stap.uitleg}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-md border border-line bg-paper p-6 space-y-3">
        <h2 className="font-serif text-xl">Wat als een wet wordt verworpen?</h2>
        <p className="text-sm leading-relaxed">
          Als de Tweede of Eerste Kamer een voorstel verwerpt, stopt het
          proces. De minister kan een nieuw, aangepast voorstel indienen — dan
          begint het proces opnieuw bij stap 1. Een minister kan een voorstel
          ook intrekken voordat er gestemd wordt, bijvoorbeeld als duidelijk is
          dat er geen meerderheid voor is.
        </p>
      </section>

      <section className="rounded-md border border-line bg-paper p-6 space-y-3">
        <h2 className="font-serif text-xl">Wanneer treedt een wet in werking?</h2>
        <p className="text-sm leading-relaxed">
          De ondertekening door de Koning en de publicatie in het Staatsblad
          maken een voorstel formeel tot wet. De daadwerkelijke inwerkingtreding
          gebeurt vaak pas later — meestal op een vaste datum (1 januari of
          1 juli), of als de uitvoeringsorganisatie klaar is. Soms staat de
          inwerkingtreding al in de wet zelf, soms wordt die later bij koninklijk
          besluit bepaald.
        </p>
      </section>

      <section className="text-sm text-mute">
        Bron en achtergrond:{" "}
        <a
          href="https://www.tweedekamer.nl/zo-werkt-de-kamer/de-nederlandse-democratie/hoe-komt-een-wet-tot-stand"
          className="underline hover:text-ink"
        >
          tweedekamer.nl — Hoe komt een wet tot stand
        </a>
        {", "}
        <a
          href="https://www.eerstekamer.nl/begrip/wetgeving"
          className="underline hover:text-ink"
        >
          eerstekamer.nl — Wetgeving
        </a>
        .
      </section>
    </article>
  );
}
