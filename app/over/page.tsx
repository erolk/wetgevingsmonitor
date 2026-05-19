import { getDict, tpl } from "@/lib/i18n";

export default async function Over() {
  const { dict } = await getDict();
  const t = dict.about;
  return (
    <article className="prose prose-sm max-w-2xl space-y-4">
      <h1 className="font-serif text-2xl sm:text-3xl">{t.title}</h1>

      <p>{t.para1}</p>
      <p>{t.para2}</p>

      <h2 className="font-serif text-xl mt-8">{t.sourcesTitle}</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>{t.sourceTkLabel}</strong> —{" "}
          <a
            href="https://opendata.tweedekamer.nl"
            className="underline hover:text-ink"
          >
            opendata.tweedekamer.nl
          </a>
          .{" "}
          {tpl(t.sourceTkDescription, {
            endpoint: "gegevensmagazijn.tweedekamer.nl/OData/v4/2.0",
          })}
        </li>
        <li>
          <strong>{t.sourceKoopLabel}</strong> — {t.sourceKoopDescription}
        </li>
        <li>
          <strong>{t.sourceWettenLabel}</strong> — {t.sourceWettenDescription}
        </li>
      </ul>

      <h2 className="font-serif text-xl mt-8">{t.explanationTitle}</h2>
      <p className="text-sm">{t.explanationBody}</p>

      <h2 className="font-serif text-xl mt-8">{t.howMinistryTitle}</h2>
      <p className="text-sm">{t.howMinistryBody}</p>

      <h2 className="font-serif text-xl mt-8">{t.disclaimerTitle}</h2>
      <p className="text-sm text-mute">{t.disclaimerBody}</p>
    </article>
  );
}
