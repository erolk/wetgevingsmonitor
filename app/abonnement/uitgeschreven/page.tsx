import Link from "next/link";

export default function Uitgeschreven() {
  return (
    <div className="max-w-xl space-y-4 py-12">
      <div className="text-4xl">👋</div>
      <h1 className="font-serif text-3xl">Je bent uitgeschreven</h1>
      <p className="text-mute leading-relaxed">
        Je e-mailadres is verwijderd uit onze lijst. Je krijgt geen verdere
        mails meer over dit abonnement.
      </p>
      <p>
        <Link href="/" className="text-accent underline hover:no-underline">
          ← terug naar overzicht
        </Link>
      </p>
    </div>
  );
}
