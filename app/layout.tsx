import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-line bg-surface/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-5 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
            >
              <span className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-accent shrink-0" />
              <span className="font-serif text-base sm:text-xl tracking-tight truncate">
                Wetgevings<span className="text-accent">monitor</span>
              </span>
            </Link>
            <nav className="text-xs sm:text-sm text-mute flex items-center gap-3 sm:gap-5 shrink-0">
              <Link href="/" className="hover:text-ink hidden sm:inline">
                Ministeries
              </Link>
              <Link href="/proces" className="hover:text-ink">
                <span className="sm:hidden">Proces</span>
                <span className="hidden sm:inline">Hoe werkt het?</span>
              </Link>
              <Link href="/over" className="hover:text-ink">
                Over
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </main>
        <footer className="border-t border-line mt-12 sm:mt-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 text-xs text-mute">
            Brongegevens: Tweede Kamer Open Data (CC0). Geen officiële site van
            de overheid.
          </div>
        </footer>
      </body>
    </html>
  );
}
