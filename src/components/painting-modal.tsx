"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorSwatch } from "@/components/color-swatch";
import { ColorDetail } from "@/components/color-detail";
import { PaletteExport } from "@/components/palette-export";
import { getMovement } from "@/lib/data";
import type { Painting, Color } from "@/lib/types";

interface PaintingModalProps {
  painting: Painting | null;
  onClose: () => void;
}

export function PaintingModal({ painting, onClose }: PaintingModalProps) {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);

  if (!painting) return null;

  const movement = getMovement(painting.movementId);

  function handleCopyColor(color: Color) {
    navigator.clipboard.writeText(color.hex.toUpperCase()).then(() => {
      toast(`Copied ${color.hex.toUpperCase()}`, {
        description: color.name,
        duration: 2000,
      });
    });
  }

  return (
    <Dialog
      open={!!painting}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedColor(null);
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] min-w-[40%] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{painting.title} by {painting.artist}</DialogTitle>
        <ScrollArea className="max-h-[90vh]">
          <div className="grid md:grid-cols-2">
            {/* Left: Painting image */}
            <div className="relative aspect-[4/3] w-full bg-muted md:aspect-auto md:min-h-[500px]">
              <Image
                src={painting.image}
                alt={`${painting.title} by ${painting.artist}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Right: Palette and info */}
            <div className="flex flex-col p-5">
              {/* Palette */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Color Palette
                  </h3>
                  <PaletteExport painting={painting} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {painting.colors.map((color, i) => (
                    <ColorSwatch
                      key={i}
                      color={color}
                      isSelected={selectedColor?.hex === color.hex}
                      onClick={() => {
                        setSelectedColor(color);
                        handleCopyColor(color);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Selected color detail */}
              {selectedColor && (
                <ColorDetail color={selectedColor} className="mt-4" />
              )}

              {/* Painting info */}
              <div className="mt-6 border-t border-border pt-4">
                <h2 className="font-serif text-xl font-bold">
                  {painting.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {painting.artist}, {painting.year}
                </p>

                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Medium:</span>{" "}
                    {painting.medium}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Dimensions:
                    </span>{" "}
                    {painting.dimensions}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Location:
                    </span>{" "}
                    {painting.location}
                  </p>
                </div>

                {movement && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Part of the{" "}
                    <Link
                      href={`/movement/${movement.slug}`}
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
                      onClick={() => onClose()}
                    >
                      {movement.name}
                    </Link>{" "}
                    movement
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground/60">
                  Image: {painting.imageCredit}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
