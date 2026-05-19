"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/types";

type Props = {
  locale: Locale;
  /** Label voor de tegenovergestelde taal (komt uit dict.common.languageToggle). */
  toggleLabel: string;
  /** Label voor huidige taal (voor aria-label / title). */
  currentLabel: string;
};

export function LanguageToggle({ locale, toggleLabel, currentLabel }: Props) {
  const router = useRouter();

  function setLocale(next: Locale) {
    document.cookie = `locale=${next};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "nl" ? "en" : "nl")}
      aria-label={`Switch language (currently ${currentLabel})`}
      title={`Taal wisselen / Switch language`}
      className="text-xs font-mono uppercase tracking-wider text-mute hover:text-ink transition px-1.5 py-0.5 rounded border border-line hover:border-ink"
    >
      {toggleLabel}
    </button>
  );
}
