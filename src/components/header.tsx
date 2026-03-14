"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { movements } from "@/lib/data";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Period } from "@/lib/types";

const periodOrder: Period[] = ["Renaissance", "Baroque", "19th Century", "Modern"];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const grouped = periodOrder
    .map((period) => ({
      period,
      movements: movements.filter((m) => m.period === period),
    }))
    .filter((g) => g.movements.length > 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <div className="h-6 w-1.5 rounded-full bg-rose-500" />
            <div className="h-6 w-1.5 rounded-full bg-amber-500" />
            <div className="h-6 w-1.5 rounded-full bg-emerald-500" />
            <div className="h-6 w-1.5 rounded-full bg-blue-500" />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">
            ChromaMasters
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className={`text-sm transition-colors hover:text-foreground ${
              pathname === "/" ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            href="/paintings"
            className={`text-sm transition-colors hover:text-foreground ${
              pathname === "/paintings" ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            All Paintings
          </Link>
          <Link
            href="/extract"
            className={`text-sm transition-colors hover:text-foreground ${
              pathname === "/extract" ? "text-foreground font-medium" : "text-muted-foreground"
            }`}
          >
            MyPalette
          </Link>
          <ThemeToggle />
        </nav>

        {/* Theme toggle + Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent"
            aria-label="Toggle menu"
          >
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Home
            </Link>
            <Link
              href="/paintings"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              All Paintings
            </Link>
            <Link
              href="/extract"
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              MyPalette
            </Link>
            <hr className="my-2 border-border" />
            {grouped.map(({ period, movements: periodMovements }) => (
              <div key={period}>
                <p className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                  {period}
                </p>
                {periodMovements.map((movement) => (
                  <Link
                    key={movement.id}
                    href={`/movement/${movement.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      pathname === `/movement/${movement.slug}`
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    {movement.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
