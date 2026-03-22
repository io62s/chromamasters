"use client";

import chroma from "chroma-js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Color } from "@/lib/types";

interface ColorSwatchProps {
  color: Color;
  isSelected: boolean;
  isPinned?: boolean;
  onClick: () => void;
  onTogglePin?: () => void;
}

export function ColorSwatch({ color, isSelected, isPinned, onClick, onTogglePin }: ColorSwatchProps) {
  const textColor = chroma(color.hex).luminance() > 0.4 ? "#1a1a1a" : "#f5f5f5";

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={`group/swatch relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg transition-all hover:scale-105 ${
          isSelected
            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
            : ""
        }`}
        style={{ backgroundColor: color.hex }}
      >
        {/* Pin toggle button */}
        {onTogglePin && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                e.preventDefault();
                onTogglePin();
              }
            }}
            className={`absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full transition-opacity cursor-pointer ${
              isPinned
                ? "opacity-100"
                : "opacity-0 group-hover/swatch:opacity-60"
            }`}
            style={{
              backgroundColor: isPinned
                ? chroma(color.hex).luminance() > 0.4 ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)"
                : "transparent",
            }}
            title={isPinned ? "Unpin color" : "Pin color (keeps it during shuffle)"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: textColor }}
            >
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z" />
            </svg>
          </div>
        )}

      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-center">
        <p className="font-medium">{color.name}</p>
        <p className="text-xs text-muted-foreground">
          {color.hex.toUpperCase()}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
