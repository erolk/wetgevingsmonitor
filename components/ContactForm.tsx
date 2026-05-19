"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";

type Props = {
  dict: Dictionary;
};

export function ContactForm({ dict }: Props) {
  const t = dict.contact;
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
        setFeedback(data.error ?? t.formGenericError);
        return;
      }
      setStatus("ok");
      setFeedback(data.bericht);
    } catch {
      setStatus("error");
      setFeedback(t.formGenericError);
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-line bg-surface p-5 max-w-xl">
        <div className="flex items-center gap-2 text-ink font-medium mb-1">
          <span aria-hidden>✓</span> {feedback}
        </div>
        <p className="text-sm text-mute leading-relaxed">{t.successHint}</p>
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
        <span className="text-xs text-mute">{t.formName}</span>
        <input
          type="text"
          required
          minLength={2}
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder={t.formNamePlaceholder}
        />
      </label>

      <label className="block">
        <span className="text-xs text-mute">{t.formEmail}</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder={t.formEmailPlaceholder}
        />
      </label>

      <label className="block">
        <span className="text-xs text-mute">{t.formMessage}</span>
        <textarea
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          value={bericht}
          onChange={(e) => setBericht(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:border-accent resize-y"
          placeholder={t.formMessagePlaceholder}
        />
        <span className="block text-[10px] text-mute mt-1 text-right">
          {t.formCharCounter.replace("{n}", String(bericht.length))}
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
        <span>{t.formConsent}</span>
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
          {status === "loading" ? t.formSubmitting : t.formSubmit}
        </button>
      </div>
    </form>
  );
}
