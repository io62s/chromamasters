"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  exportAsCSS,
  exportAsTailwind,
  exportAsPNG,
  exportAsASE,
  downloadText,
  downloadBlob,
} from "@/lib/palette-export";
import type { Painting } from "@/lib/types";

interface PaletteExportProps {
  painting: Painting;
}

export function PaletteExport({ painting }: PaletteExportProps) {
  const [open, setOpen] = useState(false);

  const slug = painting.title.toLowerCase().replace(/\s+/g, "-");

  async function handleExport(format: string) {
    switch (format) {
      case "css": {
        const css = exportAsCSS(painting.colors, painting.title);
        downloadText(css, `${slug}-palette.css`);
        toast("CSS variables exported");
        break;
      }
      case "tailwind": {
        const tw = exportAsTailwind(painting.colors, painting.title);
        downloadText(tw, `${slug}-palette.js`);
        toast("Tailwind config exported");
        break;
      }
      case "png": {
        const blob = await exportAsPNG(painting.colors, painting.title);
        downloadBlob(blob, `${slug}-palette.png`);
        toast("PNG palette exported");
        break;
      }
      case "ase": {
        const buffer = exportAsASE(painting.colors, painting.title);
        downloadBlob(buffer, `${slug}-palette.ase`);
        toast("ASE swatch file exported");
        break;
      }
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Export Palette
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
            <button
              onClick={() => handleExport("png")}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
            >
              PNG Image
            </button>
            <button
              onClick={() => handleExport("ase")}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
            >
              Adobe Swatch (.ase)
            </button>
            <button
              onClick={() => handleExport("css")}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
            >
              CSS Variables
            </button>
            <button
              onClick={() => handleExport("tailwind")}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
            >
              Tailwind Config
            </button>
          </div>
        </>
      )}
    </div>
  );
}
