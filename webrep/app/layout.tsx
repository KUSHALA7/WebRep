import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { TopNav } from "@/components/top-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Space_Grotesk } from "next/font/google";

const fontSans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WebRep",
  description: "Turn static business websites into AI representatives.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <body className="font-sans" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <ThemeProvider>
          <header className="sticky top-0 z-40 border-b">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative h-8 w-8 shrink-0">
                  {/* Glow behind logo */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
                  <div className="relative h-full w-full rounded-xl overflow-hidden bg-[var(--card-bg)] border border-[var(--border-default)] flex items-center justify-center p-1.5">
                    <Image src="/logo.svg" alt="WebRep" width={22} height={22} priority />
                  </div>
                </div>
                <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors duration-200">
                  WebRep
                </span>
              </Link>

              {/* Nav + theme toggle */}
              <div className="flex items-center gap-4">
                <TopNav />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
