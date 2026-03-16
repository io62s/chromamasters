"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { movements } from "@/lib/data";
import type { Period } from "@/lib/types";

const periodOrder: Period[] = ["Renaissance", "Baroque", "19th Century", "Modern"];

function getPeriodMovements() {
  const grouped: { period: Period; movements: typeof movements }[] = [];
  for (const period of periodOrder) {
    const periodMovements = movements.filter((m) => m.period === period);
    if (periodMovements.length > 0) {
      grouped.push({ period, movements: periodMovements });
    }
  }
  return grouped;
}

export function Sidebar() {
  const pathname = usePathname();
  const grouped = getPeriodMovements();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <h2 className="mb-4 font-serif text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Movements
        </h2>
        <nav className="space-y-4">
          {grouped.map(({ period, movements: periodMovements }) => (
            <div key={period}>
              <h3 className="mb-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                {period}
              </h3>
              <ul className="space-y-0.5">
                {periodMovements.map((movement) => {
                  const isActive = pathname === `/movement/${movement.slug}`;
                  return (
                    <li key={movement.id}>
                      <Link
                        href={`/movement/${movement.slug}`}
                        className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          }`}
                      >
                        {movement.name}
                        <span className="ml-1 text-xs text-muted-foreground/50">
                          {movement.yearStart}–{movement.yearEnd}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const grouped = getPeriodMovements();

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
        Browse Movements
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 border-b border-border bg-background p-4 shadow-lg">
          <nav className="space-y-3">
            {grouped.map(({ period, movements: periodMovements }) => (
              <div key={period}>
                <h3 className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                  {period}
                </h3>
                <ul className="space-y-0.5">
                  {periodMovements.map((movement) => {
                    const isActive = pathname === `/movement/${movement.slug}`;
                    return (
                      <li key={movement.id}>
                        <Link
                          href={`/movement/${movement.slug}`}
                          onClick={() => setOpen(false)}
                          className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            }`}
                        >
                          {movement.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
