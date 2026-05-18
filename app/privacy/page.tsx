export const metadata = {
  title: "Privacyverklaring — Wetgevingsmonitor",
};

export default function Privacy() {
  return (
    <article className="max-w-2xl prose prose-sm space-y-4 py-6">
      <h1 className="font-serif text-3xl">Privacyverklaring</h1>

      <p>
        Wetgevingsmonitor is een onafhankelijk, niet-commercieel project dat
        Nederlandse wetgeving inzichtelijk maakt voor burgers. We gaan
        zorgvuldig om met je persoonsgegevens en doen niet meer dan strikt
        nodig voor het functioneren van de site.
      </p>

      <h2 className="font-serif text-xl mt-8">Welke gegevens verwerken we?</h2>
      <p>
        Alleen je <strong>e-mailadres</strong>, en de wet of het ministerie
        waarvoor je je hebt aangemeld. We slaan geen IP-adressen, namen of
        andere identificerende gegevens op.
      </p>

      <h2 className="font-serif text-xl mt-8">Waarvoor gebruiken we het?</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Om je een bevestigingsmail te sturen (dubbele opt-in).</li>
        <li>
          Om je een update te sturen zodra er een nieuw event plaatsvindt rond
          de wet of het ministerie waarop je geabonneerd bent.
        </li>
        <li>Niets anders. Geen nieuwsbrieven, geen reclame, geen derden.</li>
      </ul>

      <h2 className="font-serif text-xl mt-8">Hoe lang bewaren we het?</h2>
      <p>
        Zolang je geabonneerd bent. Bevestig je het abonnement niet binnen 7
        dagen, dan wordt je e-mailadres automatisch verwijderd. Klik je op
        &quot;uitschrijven&quot; in een mail, dan verwijderen we je gegevens
        direct.
      </p>

      <h2 className="font-serif text-xl mt-8">Jouw rechten</h2>
      <p>
        Je hebt onder de AVG recht op inzage, correctie en verwijdering van je
        gegevens. Voor uitschrijven gebruik je de link onderaan elke mail —
        dat is direct en zonder tussenkomst. Voor inzage of vragen kun je een
        bericht sturen via de contactgegevens hieronder.
      </p>

      <h2 className="font-serif text-xl mt-8">Derde partijen</h2>
      <p>
        We sturen mails via een transactionele e-mailprovider (in de huidige
        opzet: Resend, EU-regio). Deze provider verwerkt enkel het
        e-mailadres en de inhoud van de mail, uitsluitend om te bezorgen.
      </p>

      <h2 className="font-serif text-xl mt-8">Cookies</h2>
      <p>
        De site plaatst geen tracking-cookies. Alleen technische cookies die
        nodig zijn om de site te laten functioneren (bv. bij het invullen van
        een formulier).
      </p>

      <h2 className="font-serif text-xl mt-8">Contact</h2>
      <p className="text-mute text-sm">
        Voor vragen over je gegevens: vul hier je eigen contactadres in
        voordat je publiceert (bv.{" "}
        <code>privacy@wetgevingsmonitor.nl</code>).
      </p>

      <p className="text-xs text-mute mt-8">
        Laatst bijgewerkt: mei 2026
      </p>
    </article>
  );
}
