import Link from "next/link";
import { PROCES_STAPPEN } from "@/lib/proces";
import { ProcesBalk } from "@/components/ProcesBalk";
import { getDict } from "@/lib/i18n";

export const metadata = {
  title: "Hoe wordt een wet gemaakt? — Wetgevingsmonitor",
  description:
    "In acht stappen door het Nederlandse wetgevingsproces: van ministerie en Raad van State tot Tweede Kamer, Eerste Kamer en Staatsblad.",
};

export default async function ProcesPagina() {
  const { dict } = await getDict();
  const t = dict.proces;
  return (
    <article className="space-y-12">
      <header className="space-y-4 max-w-2xl">
        <Link
          href="/"
          className="text-sm text-mute hover:text-ink inline-flex items-center gap-1"
        >
          ← terug
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl tracking-tight leading-tight">
          {t.title}
        </h1>
        <p className="text-mute leading-relaxed">{t.intro}</p>
      </header>

      <section className="rounded-md border border-line bg-surface p-6">
        <ProcesBalk fase="plenair_tk" compact />
        <p className="text-xs text-mute mt-4">{t.exampleNote}</p>
      </section>

      <section>
        <h2 className="font-serif text-2xl mb-6">{t.stepsTitle}</h2>
        <ol className="space-y-6">
          {PROCES_STAPPEN.map((stap, i) => {
            const labels = t.stappen[stap.id] ?? {
              korteNaam: stap.korteNaam,
              volledigeNaam: stap.volledigeNaam,
              uitleg: stap.uitleg,
              waar: stap.waar,
            };
            return (
              <li
                key={stap.id}
                className="grid grid-cols-[auto_1fr] gap-4 items-start"
              >
                <div className="h-9 w-9 rounded-full bg-accent text-white flex items-center justify-center font-serif text-base shrink-0">
                  {i + 1}
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="font-serif text-xl">{labels.volledigeNaam}</h3>
                    <span className="text-xs uppercase tracking-wider text-mute">
                      {t.waarLabel} {labels.waar}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">
                    {labels.uitleg}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">{t.statusTitle}</h2>
        <p className="text-sm text-mute leading-relaxed max-w-2xl">
          {t.statusIntro}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="py-2 pr-4 font-medium align-bottom">
                  {t.statusColStatus}
                </th>
                <th className="py-2 pr-4 font-medium align-bottom">
                  {t.statusColMeaning}
                </th>
                <th className="py-2 font-medium align-bottom">
                  {t.statusColFases}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60 align-top">
                <td className="py-3 pr-4">
                  <span className="inline-block rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 px-2.5 py-1 text-xs font-medium whitespace-nowrap">
                    {t.statusLopendLabel}
                  </span>
                </td>
                <td className="py-3 pr-4 leading-relaxed">
                  {t.statusLopendMeaning}
                </td>
                <td className="py-3 text-mute leading-relaxed">
                  {t.statusLopendFases}
                </td>
              </tr>
              <tr className="align-top">
                <td className="py-3 pr-4">
                  <span className="inline-block rounded-full bg-green-200 text-green-900 dark:bg-green-800/40 dark:text-green-100 px-2.5 py-1 text-xs font-medium whitespace-nowrap">
                    {t.statusAfgerondLabel}
                  </span>
                </td>
                <td className="py-3 pr-4 leading-relaxed">
                  {t.statusAfgerondMeaning}
                </td>
                <td className="py-3 text-mute leading-relaxed">
                  {t.statusAfgerondFases}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-mute leading-relaxed max-w-2xl rounded-md border border-line bg-surface p-3">
          {t.statusNote}
        </p>
      </section>

      <section className="rounded-md border border-line bg-surface p-6 space-y-3">
        <h2 className="font-serif text-xl">{t.rejectedTitle}</h2>
        <p className="text-sm leading-relaxed">{t.rejectedBody}</p>
      </section>

      <section className="rounded-md border border-line bg-surface p-6 space-y-3">
        <h2 className="font-serif text-xl">{t.enactTitle}</h2>
        <p className="text-sm leading-relaxed">{t.enactBody}</p>
      </section>

      <section className="text-sm text-mute">
        {t.sourcesPrefix}{" "}
        <a
          href="https://www.tweedekamer.nl/zo-werkt-de-kamer/de-nederlandse-democratie/hoe-komt-een-wet-tot-stand"
          className="underline hover:text-ink"
        >
          {t.sourceTk}
        </a>
        {", "}
        <a
          href="https://www.eerstekamer.nl/begrip/wetgeving"
          className="underline hover:text-ink"
        >
          {t.sourceEk}
        </a>
        .
      </section>
    </article>
  );
}
