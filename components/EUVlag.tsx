// De vlag van de Europese Unie: 12 gouden vijfpuntige sterren in een cirkel op
// een veld van EU-blauw. Posities en sterpunten worden exact berekend, zodat de
// vlag ook klein (in de header) scherp en herkenbaar blijft.

const BLAUW = "#003399";
const GEEL = "#FFCC00";

// Punten van één vijfpuntige ster rond (cx, cy), buitenstraal ro.
function sterPunten(cx: number, cy: number, ro: number): string {
  const ri = ro * 0.382; // verhouding binnen-/buitenstraal van een pentagram
  const punten: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? ro : ri;
    const hoek = ((-90 + i * 36) * Math.PI) / 180;
    punten.push(
      `${(cx + r * Math.cos(hoek)).toFixed(2)},${(cy + r * Math.sin(hoek)).toFixed(2)}`,
    );
  }
  return punten.join(" ");
}

export function EUVlag({ className }: { className?: string }) {
  const cx = 15;
  const cy = 10;
  const cirkelStraal = 6.2; // straal van de sterrenkring
  const sterStraal = 1.15;

  const sterren = Array.from({ length: 12 }, (_, k) => {
    const hoek = ((-90 + k * 30) * Math.PI) / 180; // 12 posities, klokwijs
    return sterPunten(
      cx + cirkelStraal * Math.cos(hoek),
      cy + cirkelStraal * Math.sin(hoek),
      sterStraal,
    );
  });

  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="Vlag van de Europese Unie"
    >
      <rect width="30" height="20" rx="2.5" fill={BLAUW} />
      {sterren.map((punten, i) => (
        <polygon key={i} points={punten} fill={GEEL} />
      ))}
    </svg>
  );
}
