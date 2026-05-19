"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n/types";

type Props = (
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
    }
) & {
  dict: Dictionary;
};

export function SubscribeButton(props: Props) {
  const t = props.dict.subscribe;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [avg, setAvg] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [bericht, setBericht] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open && status === "idle") {
      const id = setTimeout(() => emailInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open, status]);

  function close() {
    setOpen(false);
    if (status === "ok") {
      setStatus("idle");
      setEmail("");
      setAvg(false);
      setBericht(null);
    }
  }

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
        setBericht(data.error ?? t.genericError);
        return;
      }
      setStatus("ok");
      setBericht(data.bericht);
    } catch {
      setStatus("error");
      setBericht(t.genericError);
    }
  }

  const label =
    props.target === "wet"
      ? t.wetLabel
      : t.ministryLabel.replace("{naam}", props.naam);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md border border-accent bg-accent text-paper hover:bg-accentDark transition px-4 py-2 text-left max-w-full ${
          props.compact ? "text-sm" : "text-sm sm:text-base"
        }`}
      >
        <span aria-hidden className="shrink-0">
          ✉
        </span>
        <span className="break-words">{label}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-line bg-paper shadow-2xl">
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-line">
              <h2 className="font-medium text-ink leading-snug">{label}</h2>
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="shrink-0 -mr-1 -mt-1 p-1 rounded text-mute hover:text-ink hover:bg-surface transition"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {status === "ok" ? (
              <div className="px-5 py-5 space-y-3">
                <div className="flex items-center gap-2 text-ink font-medium">
                  <span aria-hidden className="text-emerald-600">
                    ✓
                  </span>{" "}
                  {bericht}
                </div>
                <p className="text-sm text-mute leading-relaxed">
                  {t.activate}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md border border-line px-3 py-2 text-sm hover:border-ink transition text-mute hover:text-ink"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="px-5 py-5 space-y-4">
                <p className="text-xs text-mute leading-relaxed">
                  {t.description}
                </p>
                <label className="block">
                  <span className="text-xs text-mute">{t.yourEmail}</span>
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:border-accent"
                    placeholder={t.emailPlaceholder}
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
                    {t.consent.replace(
                      "{privacy}",
                      "",
                    ).split(t.privacyLink).map((part, i, arr) =>
                      i < arr.length - 1 ? (
                        <span key={i}>
                          {part}
                          <a
                            href="/privacy"
                            target="_blank"
                            className="underline"
                          >
                            {t.privacyLink}
                          </a>
                        </span>
                      ) : (
                        <span key={i}>{part}</span>
                      ),
                    )}
                  </span>
                </label>
                {status === "error" && bericht && (
                  <div className="text-xs text-rose-700">{bericht}</div>
                )}
                <div className="flex flex-wrap-reverse gap-2 pt-1">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md border border-line px-3 py-2 text-sm hover:border-ink transition text-mute hover:text-ink"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="flex-1 min-w-0 rounded-md bg-accent text-paper px-3 py-2 text-sm hover:bg-accentDark transition disabled:opacity-50"
                  >
                    {status === "loading" ? t.submitting : t.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
