"use client";

import { useState } from "react";

export function ContactForm() {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [bericht, setBericht] = useState("");
  const [avg, setAvg] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setFeedback(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, email, bericht, avg, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setFeedback(data.error ?? "Er ging iets mis");
        return;
      }
      setStatus("ok");
      setFeedback(data.bericht);
    } catch {
      setStatus("error");
      setFeedback("Kon bericht niet versturen");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-line bg-surface p-5 max-w-xl">
        <div className="flex items-center gap-2 text-ink font-medium mb-1">
          <span aria-hidden>✓</span> {feedback}
        </div>
        <p className="text-sm text-mute leading-relaxed">
          We reageren meestal binnen een paar dagen op het opgegeven
          e-mailadres.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md border border-line bg-surface p-5 max-w-xl"
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        <label>
          Website (laat leeg)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs text-mute">Naam</span>
        <input
          type="text"
          required
          minLength={2}
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="Jouw naam"
        />
      </label>

      <label className="block">
        <span className="text-xs text-mute">E-mailadres</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="naam@voorbeeld.nl"
        />
      </label>

      <label className="block">
        <span className="text-xs text-mute">Opmerkingen / vraag</span>
        <textarea
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          value={bericht}
          onChange={(e) => setBericht(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y"
          placeholder="Vraag, opmerking, verbetering of typfout? Laat het weten."
        />
        <span className="block text-[10px] text-mute mt-1 text-right">
          {bericht.length}/5000
        </span>
      </label>

      <label className="flex items-start gap-2 text-xs text-mute leading-relaxed">
        <input
          type="checkbox"
          checked={avg}
          onChange={(e) => setAvg(e.target.checked)}
          className="mt-0.5"
          required
        />
        <span>
          Ik weet dat mijn naam en e-mailadres alleen gebruikt worden om
          antwoord te kunnen geven en niet verder worden gedeeld.
        </span>
      </label>

      {status === "error" && feedback && (
        <div className="text-xs text-rose-700">{feedback}</div>
      )}

      <div className="pt-1">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-accent text-paper px-4 py-2 text-sm hover:bg-accentDark transition disabled:opacity-50"
        >
          {status === "loading" ? "Versturen…" : "Verstuur bericht"}
        </button>
      </div>
    </form>
  );
}
