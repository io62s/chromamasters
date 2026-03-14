"use client";

import { useCompare } from "@/components/compare-provider";

export function CompareBar() {
  const { pinned, clearPinned, setShowCompare, togglePin } = useCompare();

  if (pinned.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <span className="text-xs font-medium text-muted-foreground">
          Compare ({pinned.length}/3):
        </span>
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {pinned.map((painting) => (
            <div
              key={painting.id}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1"
            >
              <div className="flex gap-0.5">
                {painting.colors.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <span className="max-w-[120px] truncate text-xs">
                {painting.title}
              </span>
              <button
                onClick={() => togglePin(painting)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="flex shrink-0 gap-2">
          {pinned.length >= 2 && (
            <button
              onClick={() => setShowCompare(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Compare
            </button>
          )}
          <button
            onClick={clearPinned}
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
