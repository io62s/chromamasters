"use client";

import Image from "next/image";
import chroma from "chroma-js";
import { toast } from "sonner";
import { useCompare } from "@/components/compare-provider";
import type { Painting } from "@/lib/types";

export function CompareView() {
  const { pinned, showCompare, setShowCompare } = useCompare();

  if (!showCompare || pinned.length < 2) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-border bg-background p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold">Compare Palettes</h2>
          <button
            onClick={() => setShowCompare(false)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
          >
            Close
          </button>
        </div>

        <div className={`grid gap-6 ${pinned.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {pinned.map((painting) => (
            <CompareColumn key={painting.id} painting={painting} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CompareColumn({ painting }: { painting: Painting }) {
  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={painting.image}
          alt={painting.title}
          fill
          className="object-cover"
          sizes="33vw"
        />
      </div>

      {/* Title */}
      <div>
        <h3 className="font-serif text-sm font-semibold">{painting.title}</h3>
        <p className="text-xs text-muted-foreground">
          {painting.artist}, {painting.year}
        </p>
      </div>

      {/* Palette */}
      <div className="space-y-1.5">
        {painting.colors.map((color, i) => {
          const textColor =
            chroma(color.hex).luminance() > 0.4 ? "#1a1a1a" : "#f5f5f5";
          return (
            <button
              key={i}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-1.5 transition-opacity hover:opacity-80"
              style={{ backgroundColor: color.hex }}
              onClick={() => {
                navigator.clipboard.writeText(color.hex.toUpperCase()).then(() => {
                  toast(`Copied ${color.hex.toUpperCase()}`, {
                    description: color.name,
                    duration: 2000,
                  });
                });
              }}
            >
              <span className="text-xs font-medium" style={{ color: textColor }}>
                {color.name}
              </span>
              <span className="text-xs" style={{ color: textColor }}>
                {color.hex.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
