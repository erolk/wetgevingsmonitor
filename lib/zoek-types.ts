// Shared type tussen de zoek-API en de client-side zoek-pagina.
// Bewust in een eigen bestand zodat het client-component geen server-only
// modules (fs/path) via de route-import in zijn bundle krijgt.

export type ZoekItem = {
  id: string;
  nummer: string;
  titel: string;
  onderwerp: string;
  fase: string;
  ministerie: { slug: string; afkorting: string; korteNaam: string };
  gestartOp: string | null;
  afgedaan: boolean;
  uitlegTekst: string | null;
  voorWie: string[] | null;
};
