export default function Over() {
  return (
    <article className="prose prose-sm max-w-2xl space-y-4">
      <h1 className="font-serif text-3xl">Over deze site</h1>

      <p>
        Wetgevingsmonitor maakt zichtbaar welke wetten er op dit moment in
        Den Haag op tafel liggen, per ministerie. Voor elk wetsvoorstel zie je
        waar het zich nu bevindt in het proces, wat de eerstvolgende activiteit
        is (debat, stemming, behandeling in commissie), en — in begrijpelijke
        taal — wat het voor een gewone burger betekent.
      </p>

      <p>
        De site is onafhankelijk, niet-commercieel, en heeft geen banden met de
        Rijksoverheid of welke politieke partij dan ook. Doel: laten zien dat
        de politiek wel degelijk inhoudelijk bezig is, en niet alleen aan het
        vergaderen is.
      </p>

      <h2 className="font-serif text-xl mt-8">Gebruikte bronnen</h2>
      <ul className="list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Tweede Kamer Open Data</strong> —{" "}
          <a
            href="https://opendata.tweedekamer.nl"
            className="underline hover:text-ink"
          >
            opendata.tweedekamer.nl
          </a>
          . OData v4 API, basisendpoint{" "}
          <code className="text-xs">
            gegevensmagazijn.tweedekamer.nl/OData/v4/2.0
          </code>
          . Licentie: CC0.
        </li>
        <li>
          <strong>KOOP / officielebekendmakingen.nl</strong> — bron voor
          Staatsblad en Kamerstukken (toekomstige uitbreiding).
        </li>
        <li>
          <strong>wetten.overheid.nl</strong> — geldende wettekst als een
          voorstel wet is geworden.
        </li>
      </ul>

      <h2 className="font-serif text-xl mt-8">Burger-uitleg</h2>
      <p className="text-sm">
        Bij elk wetsvoorstel staat een korte uitleg in begrijpelijke taal.
        Deze wordt automatisch gegenereerd met behulp van AI (Claude) op basis
        van de officiële titel en het onderwerp uit de Tweede Kamer-bron.
        Deze uitleg is bedoeld als hulp bij het begrijpen — voor juridische
        details raadpleeg altijd de officiële stukken.
      </p>

      <h2 className="font-serif text-xl mt-8">
        Hoe wordt &quot;ministerie&quot; bepaald?
      </h2>
      <p className="text-sm">
        De Tweede Kamer legt per zaak vast welke vaste commissie het voortouw
        heeft in de behandeling. Iedere vaste commissie correspondeert met
        één ministerie. We groeperen wetsvoorstellen op die voortouwcommissie.
      </p>

      <h2 className="font-serif text-xl mt-8">Disclaimer</h2>
      <p className="text-sm text-mute">
        Geen officiële uiting van de Nederlandse overheid. Hoewel de
        brondata open en betrouwbaar is, kan er vertraging of een
        weergavefout in zitten. Voor besluitvorming altijd de officiële bron
        raadplegen.
      </p>
    </article>
  );
}
