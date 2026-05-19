import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Contact — Wetgevingsmonitor",
  description:
    "Heb je een vraag, opmerking of suggestie voor de Wetgevingsmonitor? Laat het hier weten.",
};

export default async function ContactPagina() {
  const { dict } = await getDict();
  return (
    <div className="max-w-2xl space-y-6 py-6 sm:py-10">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl">{dict.contact.title}</h1>
        <p className="text-mute leading-relaxed">{dict.contact.intro}</p>
      </header>

      <ContactForm dict={dict} />

      <section className="text-xs text-mute leading-relaxed space-y-2 pt-2">
        <p>{dict.contact.footerNote}</p>
        <p>{dict.contact.privacyTitle}</p>
      </section>
    </div>
  );
}
