"use client";

import chroma from "chroma-js";
import type { Color } from "@/lib/types";

interface ColorDetailProps {
  color: Color;
  className?: string;
}

export function ColorDetail({ color, className = "" }: ColorDetailProps) {
  const c = chroma(color.hex);
  const [r, g, b] = c.rgb();
  const [h, s, l] = c.hsl().map((v, i) =>
    i === 0 ? Math.round(v || 0) : Math.round((v || 0) * 100)
  );
  const [cVal, m, y, k] = c.cmyk().map((v) => Math.round(v * 100));

  return (
    <div
      className={`rounded-lg border border-border bg-accent/30 p-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 shrink-0 rounded-md"
          style={{ backgroundColor: color.hex }}
        />
        <div>
          <p className="text-sm font-semibold">{color.name}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {color.role}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">HEX</span>{" "}
          {color.hex.toUpperCase()}
        </p>
        <p>
          <span className="font-medium text-foreground">RGB</span> {r}, {g}, {b}
        </p>
        <p>
          <span className="font-medium text-foreground">HSL</span> {h}°, {s}%,{" "}
          {l}%
        </p>
        <p>
          <span className="font-medium text-foreground">CMYK</span> {cVal}, {m},{" "}
          {y}, {k}
        </p>
      </div>
    </div>
  );
}
