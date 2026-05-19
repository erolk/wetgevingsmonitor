import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — Wetgevingsmonitor",
  description:
    "Heb je een vraag, opmerking of suggestie voor de Wetgevingsmonitor? Laat het hier weten.",
};

export default function ContactPagina() {
  return (
    <div className="max-w-2xl space-y-6 py-6 sm:py-10">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl">Contact</h1>
        <p className="text-mute leading-relaxed">
          Vraag, opmerking, typfout gevonden of een idee voor een verbetering?
          Stuur het hieronder. Berichten komen rechtstreeks bij de beheerder
          terecht — geen mailinglijst, geen automatisch antwoord.
        </p>
      </header>

      <ContactForm />

      <section className="text-xs text-mute leading-relaxed space-y-2 pt-2">
        <p>
          We gebruiken je gegevens alleen om te kunnen reageren. Berichten
          worden niet doorgestuurd, gepubliceerd of gedeeld met derden.
        </p>
        <p>
          Voor inhoudelijke vragen over wetsvoorstellen zelf: kijk altijd ook
          op{" "}
          <a
            href="https://www.tweedekamer.nl"
            target="_blank"
            rel="noopener"
            className="underline hover:text-ink"
          >
            tweedekamer.nl
          </a>{" "}
          of{" "}
          <a
            href="https://www.eerstekamer.nl"
            target="_blank"
            rel="noopener"
            className="underline hover:text-ink"
          >
            eerstekamer.nl
          </a>
          .
        </p>
      </section>
    </div>
  );
}
