"use client";

import { useState } from "react";

type Props =
  | {
      target: "wet";
      wetId: string;
      titel: string;
      compact?: boolean;
    }
  | {
      target: "ministerie";
      slug: string;
      naam: string;
      compact?: boolean;
    };

export function SubscribeButton(props: Props) {
  const [open, setOpen] = useState(false);
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

    const body =
      props.target === "wet"
        ? {
            targetType: "wet",
            wetId: props.wetId,
            titel: props.titel,
            email,
            avg,
          }
        : {
            targetType: "ministerie",
            slug: props.slug,
            naam: props.naam,
            email,
            avg,
          };

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setBericht(data.error ?? "Er ging iets mis");
        return;
      }
      setStatus("ok");
      setBericht(data.bericht);
    } catch {
      setStatus("error");
      setBericht("Kon abonnement niet versturen");
    }
  }

  const label =
    props.target === "wet"
      ? "Mail mij bij updates over deze wet"
      : `Mail mij bij updates over ${props.naam}`;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md border border-accent bg-accent text-paper hover:bg-accentDark transition px-4 py-2 text-left max-w-full ${
          props.compact ? "text-sm" : "text-sm sm:text-base"
        }`}
      >
        <span aria-hidden className="shrink-0">✉</span>
        <span className="break-words">{label}</span>
      </button>
    );
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-line bg-surface p-4 text-sm">
        <div className="flex items-center gap-2 text-ink font-medium mb-1">
          <span aria-hidden>✓</span> {bericht}
        </div>
        <div className="text-mute">
          Klik op de bevestigingslink in de mail om je abonnement te activeren.
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-line bg-surface p-4 space-y-3 max-w-md"
    >
      <div className="font-medium text-ink">{label}</div>
      <p className="text-xs text-mute leading-relaxed">
        Je krijgt een mail bij elk nieuw event: behandeling in commissie,
        plenair debat, stemming (inclusief voor/tegen per fractie), en
        besluiten in de Eerste Kamer.
      </p>
      <label className="block">
        <span className="text-xs text-mute">Je e-mailadres</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="naam@voorbeeld.nl"
        />
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
          Ik ga akkoord met de{" "}
          <a href="/privacy" target="_blank" className="underline">
            privacyverklaring
          </a>{" "}
          en weet dat ik me altijd kan uitschrijven via de link in elke mail.
        </span>
      </label>
      {status === "error" && bericht && (
        <div className="text-xs text-rose-700">{bericht}</div>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-accent text-paper px-3 py-2 text-sm hover:bg-accentDark transition disabled:opacity-50"
        >
          {status === "loading" ? "Versturen…" : "Stuur bevestigingsmail"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-line px-3 py-2 text-sm hover:border-ink transition text-mute hover:text-ink"
        >
          Annuleer
        </button>
      </div>
    </form>
  );
}
