// Globale laadindicator. Next.js toont deze automatisch bij elke navigatie
// waarvan de server-render >~50ms duurt; bij snelle routes (contact, over,
// woningbouw) verschijnt 'ie niet. Effect: bezoekers zien direct feedback,
// in plaats van een blanke pagina te staren naar terwijl de homepage z'n
// 15 ministerie-fetches + 7 Debat Direct-dagen aan het ophalen is.

export default function Loading() {
  return (
    <div
      className="py-20 sm:py-28 text-center"
      role="status"
      aria-live="polite"
      aria-label="Pagina wordt geladen"
    >
      <div className="inline-flex items-center gap-3 text-mute">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
          <span className="relative rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <span className="text-sm">Pagina wordt geladen…</span>
      </div>
    </div>
  );
}
