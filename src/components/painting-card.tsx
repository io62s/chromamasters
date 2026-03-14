"use client";

import Image from "next/image";
import { useCompare } from "@/components/compare-provider";
import type { Painting } from "@/lib/types";

interface PaintingCardProps {
  painting: Painting;
  onClick: () => void;
}

export function PaintingCard({ painting, onClick }: PaintingCardProps) {
  const { isPinned, togglePin, pinned } = useCompare();
  const pinActive = isPinned(painting.id);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/10">
      {/* Pin button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          togglePin(painting);
        }}
        disabled={!pinActive && pinned.length >= 3}
        className={`absolute right-2 top-2 z-10 rounded-md p-1.5 text-xs font-medium transition-all ${
          pinActive
            ? "bg-primary text-primary-foreground"
            : "bg-black/50 text-white opacity-0 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-0"
        }`}
        title={pinActive ? "Unpin from compare" : "Pin to compare"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={pinActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>

      <button
        onClick={onClick}
        className="block w-full cursor-pointer text-left"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <Image
            src={painting.image}
            alt={`${painting.title} by ${painting.artist}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
        <div className="p-3">
          <h3 className="font-serif text-sm font-semibold leading-tight">
            {painting.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {painting.artist}, {painting.year}
          </p>
          {/* Palette preview strip */}
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {painting.colors.map((color, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}
