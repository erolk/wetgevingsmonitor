"use client";

import { useState } from "react";

// Inline aanmeldformulier voor de wekelijkse nieuwsbrief. Gebruikt hetzelfde
// /api/subscribe-endpoint (double opt-in) met target-type "nieuwsbrief".
export function NieuwsbriefForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [avg, setAvg] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [bericht, setBericht] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setBericht(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "nieuwsbrief", email, avg }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setBericht(data.error ?? "Er ging iets mis. Probeer het later opnieuw.");
        return;
      }
      setStatus("ok");
      setBericht(data.bericht ?? "Check je inbox om je aanmelding te bevestigen.");
    } catch {
      setStatus("error");
      setBericht("Er ging iets mis. Probeer het later opnieuw.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span aria-hidden>✓</span> {bericht}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jouw@email.nl"
          aria-label="Je e-mailadres"
          className="flex-1 min-w-0 rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-paper hover:bg-accentDark transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Bezig…" : "Aanmelden"}
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs text-mute leading-relaxed">
        <input
          type="checkbox"
          checked={avg}
          onChange={(e) => setAvg(e.target.checked)}
          required
          className="mt-0.5"
        />
        <span>
          Ik ga akkoord met de{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-ink">
            privacyverklaring
          </a>{" "}
          en wil de wekelijkse nieuwsbrief ontvangen. Uitschrijven kan altijd.
        </span>
      </label>
      {status === "error" && bericht && (
        <p className="text-xs text-rose-700">{bericht}</p>
      )}
      {!compact && (
        <p className="text-[11px] text-mute">
          Eén mail per week met de belangrijkste behandelde wetten. Geen spam,
          geen reclame.
        </p>
      )}
    </form>
  );
}
