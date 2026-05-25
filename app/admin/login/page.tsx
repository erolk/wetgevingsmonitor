import { login } from "../actions";
import { adminGeconfigureerd } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const FOUTEN: Record<string, string> = {
  "1": "Onjuist wachtwoord.",
  limiet: "Te veel pogingen. Probeer het over een paar minuten opnieuw.",
  config:
    "Het beheer is nog niet geconfigureerd. Zet ADMIN_PASSWORD en ADMIN_SESSION_SECRET in de omgeving.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const { fout } = await searchParams;
  const melding = fout ? FOUTEN[fout] ?? "Er ging iets mis." : null;
  const geconfigureerd = adminGeconfigureerd();

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="font-serif text-2xl text-ink">Beheer</h1>
      <p className="mt-2 text-sm text-mute">
        Log in om de beheerpagina te bekijken.
      </p>

      {melding && (
        <p className="mt-4 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {melding}
        </p>
      )}

      {!geconfigureerd && !melding && (
        <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Let op: <code>ADMIN_PASSWORD</code> en{" "}
          <code>ADMIN_SESSION_SECRET</code> zijn niet gezet. Inloggen werkt pas
          als die in de omgeving staan.
        </p>
      )}

      <form action={login} className="mt-6 space-y-3">
        <div>
          <label
            htmlFor="wachtwoord"
            className="block text-xs font-medium text-mute mb-1"
          >
            Wachtwoord
          </label>
          <input
            id="wachtwoord"
            name="wachtwoord"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accentDark transition-colors"
        >
          Inloggen
        </button>
      </form>
    </div>
  );
}
