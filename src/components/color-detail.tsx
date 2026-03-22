"use client";

import chroma from "chroma-js";
import type { Color } from "@/lib/types";

interface ColorDetailProps {
  color: Color;
  className?: string;
  onEyedropper?: () => void;
  eyedropperActive?: boolean;
}

export function ColorDetail({ color, className = "", onEyedropper, eyedropperActive }: ColorDetailProps) {
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
        <div className="flex-1">
          <p className="text-sm font-semibold">{color.name}</p>
          <p className="text-xs text-muted-foreground">
            {color.hex.toUpperCase()}
          </p>
        </div>
        {onEyedropper && (
          <button
            onClick={onEyedropper}
            title={eyedropperActive ? "Cancel eyedropper" : "Pick color from image"}
            className={`cursor-pointer rounded-md border p-1.5 text-xs transition-colors ${
              eyedropperActive
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 22 1-1h3l9-9" />
              <path d="M3 21v-3l9-9" />
              <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z" />
            </svg>
          </button>
        )}
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
