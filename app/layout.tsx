import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getDict } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Wetgevingsmonitor — wat doet de Tweede Kamer écht?",
  description:
    "Live overzicht van alle wetsvoorstellen per ministerie: waar ligt het, wanneer wordt erover gestemd, en wat betekent het voor jou.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eee8d8" },
    { media: "(prefers-color-scheme: dark)", color: "#121724" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { dict, locale } = await getDict();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b-[0.5px] border-accent bg-surface/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
            >
              <span className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-accent shrink-0" />
              <span className="font-serif text-base sm:text-xl tracking-tight truncate">
                {dict.nav.siteName}
                <span className="text-accent">{dict.nav.siteAccent}</span>
              </span>
            </Link>
            <nav className="text-xs sm:text-sm text-mute flex items-center gap-3 sm:gap-5 shrink-0">
              <Link href="/" className="hover:text-ink hidden sm:inline">
                {dict.nav.ministries}
              </Link>
              <Link href="/proces" className="hover:text-ink">
                <span className="sm:hidden">{dict.nav.processShort}</span>
                <span className="hidden sm:inline">{dict.nav.process}</span>
              </Link>
              <Link
                href="/over"
                className="hover:text-ink hidden sm:inline"
              >
                {dict.nav.about}
              </Link>
              <Link
                href="/contact"
                className="hover:text-ink hidden sm:inline"
              >
                {dict.nav.contact}
              </Link>
              <Link
                href="/zoeken"
                aria-label={dict.nav.searchAria}
                title={dict.nav.searchTitle}
                className="hover:text-ink inline-flex items-center justify-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </Link>
              <LanguageToggle
                locale={locale}
                toggleLabel={dict.common.languageToggle}
                currentLabel={dict.common.languageCurrent}
              />
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-line mt-12 sm:mt-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-mute">
            <p className="max-w-prose">
              {dict.footer.source} {dict.footer.notOfficial}{" "}
              <Link href="/contact" className="underline hover:text-ink">
                {dict.footer.contact}
              </Link>
            </p>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">{dict.footer.follow}</span>
              <a
                href="https://bsky.app/profile/wetgevingsmonitor.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dict.footer.blueskyAria}
                title="Bluesky"
                className="text-mute hover:text-accent transition-colors"
              >
                <svg
                  viewBox="0 0 64 57"
                  width="22"
                  height="20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/wetgevingsmonitor/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={dict.footer.instagramAria}
                title="Instagram"
                className="text-mute hover:text-accent transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
