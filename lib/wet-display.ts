import type { WetVoorstel } from "./types";

// Officiële TK-titels zijn vaak heel lang ("Wijziging van... in verband met..."),
// met de populaire korte naam tussen haakjes aan het einde, zoals
// "(Wet implementatie Richtlijn loontransparantie mannen en vrouwen)".
// Tweedekamer.nl toont in lijsten die korte naam; wij doen hetzelfde.

/**
 * Pak de populaire korte naam uit de laatste haakjes aan het einde van de
 * titel, mits dat een redelijke leesbare naam is (geen "(EU) 2023/970", geen
 * losse afkortingen). Geeft null terug als er geen geschikte korte naam is.
 */
export function korteTitel(titel: string): string | null {
  if (!titel) return null;
  const match = titel.match(/\(([^()]+)\)\s*$/);
  if (!match) return null;
  const kort = match[1].trim();
  // Geslepen filters: te kort, alleen cijfers/EU-codes/jaartallen overslaan.
  if (kort.length < 6 || kort.length > 130) return null;
  if (/^[A-Z]{1,4}[\d/\s.-]*$/.test(kort)) return null; // "EU 2023/970"
  if (/^\d/.test(kort)) return null;
  return kort;
}

/**
 * De beste titel om te tonen in een lijst:
 *   - de korte naam tussen haakjes als die er is, anders
 *   - de officiële titel (opgeschoond).
 */
export function weergaveTitel(wet: Pick<WetVoorstel, "titel">): string {
  return korteTitel(wet.titel) ?? wet.titel;
}
