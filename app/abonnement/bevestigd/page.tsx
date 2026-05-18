import Link from "next/link";

export default async function Bevestigd({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const wat = type === "wet" ? "deze wet" : "dit ministerie";
  return (
    <div className="max-w-xl space-y-4 py-12">
      <div className="text-4xl">✓</div>
      <h1 className="font-serif text-3xl">Je bent ingeschreven</h1>
      <p className="text-mute leading-relaxed">
        Vanaf nu krijg je een mailtje zodra er iets nieuws gebeurt rond {wat}.
        Bijvoorbeeld een debat, stemming, of een besluit van de Eerste Kamer.
        Bij stemmingen sturen we ook de uitslag per fractie.
      </p>
      <p>
        <Link href="/" className="text-accent underline hover:no-underline">
          ← terug naar overzicht
        </Link>
      </p>
    </div>
  );
}
