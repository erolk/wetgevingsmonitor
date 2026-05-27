import type { Metadata } from "next";
import Link from "next/link";
import { DONATE_URL, SITE_URL } from "@/lib/site";
import { NieuwsbriefForm } from "@/components/NieuwsbriefForm";

export const metadata: Metadata = {
  title: "Steun de Wetgevingsmonitor",
  description:
    "De Wetgevingsmonitor is gratis, onafhankelijk en zonder advertenties. Steun het project met een eenmalige of maandelijkse bijdrage zodat het kan blijven bestaan.",
  alternates: { canonical: `${SITE_URL}/steun` },
};

export default function SteunPagina() {
  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight">
          Steun de Wetgevingsmonitor
        </h1>
        <p className="mt-4 text-mute leading-relaxed">
          De Wetgevingsmonitor maakt wetgeving begrijpelijk voor iedereen —
          gratis, onafhankelijk en zonder advertenties. Het draait op open data
          en wordt in de vrije tijd onderhouden. Een bijdrage helpt de kosten te
          dekken (server, data, e-mail) en het project uit te breiden.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-surface px-5 py-5">
        <h2 className="font-serif text-xl text-ink">Doneer eenmalig of maandelijks</h2>
        <p className="mt-2 text-sm text-mute">
          Elke bijdrage, groot of klein, houdt de monitor onafhankelijk en
          reclamevrij.
        </p>
        {DONATE_URL ? (
          <a
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-paper hover:bg-accentDark transition-colors"
          >
            <span aria-hidden>♥</span> Doneer nu
          </a>
        ) : (
          <p className="mt-4 inline-block rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            De doneerlink wordt binnenkort geactiveerd.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-line bg-surface px-5 py-5">
        <h2 className="font-serif text-xl text-ink">Of: blijf op de hoogte</h2>
        <p className="mt-2 mb-3 text-sm text-mute">
          Geen geld, wel betrokken? Meld je aan voor de gratis wekelijkse
          nieuwsbrief — dat helpt het bereik en daarmee het project net zo goed.
        </p>
        <NieuwsbriefForm />
      </section>

      <section className="text-sm text-mute">
        <p>
          Andere manieren om te helpen: deel de site, of geef{" "}
          <Link href="/contact" className="underline hover:text-ink">
            feedback en tips
          </Link>
          . Bedankt voor je steun.
        </p>
      </section>
    </div>
  );
}
