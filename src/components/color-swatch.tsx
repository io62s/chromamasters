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
  onClick: () => void;
}

export function ColorSwatch({ color, isSelected, onClick }: ColorSwatchProps) {
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
        <span
          className="text-[10px] font-medium opacity-0 transition-opacity group-hover/swatch:opacity-100"
          style={{ color: textColor }}
        >
          {color.hex.toUpperCase()}
        </span>
        <span
          className="text-[9px] opacity-0 transition-opacity group-hover/swatch:opacity-70"
          style={{ color: textColor }}
        >
          {color.name}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-center">
        <p className="font-medium">{color.name}</p>
        <p className="text-xs text-muted-foreground">
          {color.hex.toUpperCase()} &middot; Click to copy
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
