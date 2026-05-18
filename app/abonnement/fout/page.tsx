import Link from "next/link";

export default function Fout() {
  return (
    <div className="max-w-xl space-y-4 py-12">
      <div className="text-4xl">⚠️</div>
      <h1 className="font-serif text-3xl">Link niet meer geldig</h1>
      <p className="text-mute leading-relaxed">
        De link die je gebruikte is niet (meer) geldig. Mogelijk heb je je al
        eerder uitgeschreven, of is de bevestigingslink verlopen. Probeer je
        op de site opnieuw aan te melden.
      </p>
      <p>
        <Link href="/" className="text-accent underline hover:no-underline">
          ← terug naar overzicht
        </Link>
      </p>
    </div>
  );
}
