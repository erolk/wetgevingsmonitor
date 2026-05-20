// De vlag van Nederland: drie horizontale banen — rood, wit, blauw.
// Officiële kleuren (Rijkshuisstijl): helder vermiljoen, wit, kobaltblauw.
// Zelfde 3:2-verhouding en afgeronde hoeken als de EU-vlag, zodat 'ie klein
// in de header scherp blijft.

const ROOD = "#AE1C28";
const WIT = "#FFFFFF";
const BLAUW = "#21468B";

export function NLVlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 30 20"
      className={className}
      role="img"
      aria-label="Vlag van Nederland"
    >
      <defs>
        <clipPath id="nl-vlag-rond">
          <rect width="30" height="20" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#nl-vlag-rond)">
        <rect y="0" width="30" height="6.667" fill={ROOD} />
        <rect y="6.667" width="30" height="6.666" fill={WIT} />
        <rect y="13.333" width="30" height="6.667" fill={BLAUW} />
      </g>
    </svg>
  );
}
