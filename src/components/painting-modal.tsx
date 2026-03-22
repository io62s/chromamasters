"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import chroma from "chroma-js";
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
import { assignColorName } from "@/lib/color-extraction";
import { getMovement } from "@/lib/data";
import type { Painting, Color } from "@/lib/types";

interface PaintingModalProps {
  painting: Painting | null;
  onClose: () => void;
}

export function PaintingModal({ painting, onClose }: PaintingModalProps) {
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [colors, setColors] = useState<Color[] | null>(null);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [eyedropperTargetIndex, setEyedropperTargetIndex] = useState<number | null>(null);
  const [eyedropperPreview, setEyedropperPreview] = useState<{ color: string; x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Load painting into hidden canvas when image loads
  const handleImageLoad = useCallback(() => {
    if (!painting) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      canvasRef.current = canvas;
    };
    img.src = painting.image;
  }, [painting]);

  if (!painting) return null;

  const movement = getMovement(painting.movementId);
  const displayColors = colors || painting.colors;

  function getScaledCoords(e: React.MouseEvent): { x: number; y: number } {
    const container = imageContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    // Account for object-cover: image fills container, may be cropped
    const containerAspect = rect.width / rect.height;
    const canvasAspect = canvas.width / canvas.height;
    let offsetX = 0, offsetY = 0, displayW = rect.width, displayH = rect.height;
    if (canvasAspect > containerAspect) {
      // Image wider than container — cropped left/right
      displayH = rect.height;
      displayW = rect.height * canvasAspect;
      offsetX = (displayW - rect.width) / 2;
    } else {
      // Image taller — cropped top/bottom
      displayW = rect.width;
      displayH = rect.width / canvasAspect;
      offsetY = (displayH - rect.height) / 2;
    }
    const x = Math.round(((e.clientX - rect.left + offsetX) / displayW) * canvas.width);
    const y = Math.round(((e.clientY - rect.top + offsetY) / displayH) * canvas.height);
    return {
      x: Math.max(0, Math.min(x, canvas.width - 1)),
      y: Math.max(0, Math.min(y, canvas.height - 1)),
    };
  }

  function sampleColor(coords: { x: number; y: number }): string {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const size = 3, half = Math.floor(size / 2);
    const sx = Math.max(0, Math.min(coords.x - half, canvas.width - size));
    const sy = Math.max(0, Math.min(coords.y - half, canvas.height - size));
    const d = ctx.getImageData(sx, sy, size, size);
    let rS = 0, gS = 0, bS = 0, cnt = 0;
    for (let i = 0; i < d.data.length; i += 4) {
      rS += d.data[i]; gS += d.data[i + 1]; bS += d.data[i + 2]; cnt++;
    }
    return chroma(Math.round(rS / cnt), Math.round(gS / cnt), Math.round(bS / cnt)).hex();
  }

  function handleEyedropperMove(e: React.MouseEvent) {
    if (!eyedropperActive || !canvasRef.current) return;
    const coords = getScaledCoords(e);
    const hex = sampleColor(coords);
    const container = imageContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setEyedropperPreview({
        color: hex,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }

  function handleEyedropperClick(e: React.MouseEvent) {
    if (!eyedropperActive || eyedropperTargetIndex === null || !canvasRef.current) return;
    e.preventDefault();
    const coords = getScaledCoords(e);
    const hex = sampleColor(coords);
    const name = assignColorName(hex);
    const newColor = { hex, name };
    const updated = [...displayColors];
    updated[eyedropperTargetIndex] = newColor;
    setColors(updated);
    setSelectedColor(newColor);
    setEyedropperActive(false);
    setEyedropperTargetIndex(null);
    setEyedropperPreview(null);
    toast(`Picked ${name} (${hex.toUpperCase()})`);
  }


  return (
    <Dialog
      open={!!painting}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedColor(null);
          setColors(null);
          setEyedropperActive(false);
          setEyedropperTargetIndex(null);
          setEyedropperPreview(null);
          canvasRef.current = null;
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[90vh] min-w-[40%] max-w-4xl gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">{painting.title} by {painting.artist}</DialogTitle>
        <ScrollArea className="max-h-[90vh]">
          <div className="grid md:grid-cols-2">
            {/* Left: Painting image */}
            <div
              ref={imageContainerRef}
              className={`relative aspect-[4/3] w-full overflow-hidden bg-muted md:aspect-auto md:min-h-[500px] ${
                eyedropperActive ? "cursor-crosshair" : ""
              }`}
              onMouseMove={handleEyedropperMove}
              onMouseDown={handleEyedropperClick}
              onMouseLeave={() => setEyedropperPreview(null)}
            >
              <Image
                src={painting.image}
                alt={`${painting.title} by ${painting.artist}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onLoad={handleImageLoad}
              />
              {eyedropperPreview && (
                <div
                  style={{
                    position: "absolute",
                    left: eyedropperPreview.x + 16,
                    top: eyedropperPreview.y - 16,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: eyedropperPreview.color,
                    border: "2px solid white",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                />
              )}
            </div>

            {/* Right: Palette and info */}
            <div className="flex flex-col p-5">
              {/* Palette */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Color Palette
                  </h3>
                  <PaletteExport painting={colors ? { ...painting, colors } : painting} />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {displayColors.map((color, i) => (
                    <ColorSwatch
                      key={i}
                      color={color}
                      isSelected={selectedColor?.hex === color.hex}
                      onClick={() => {
                        setSelectedColor(
                          selectedColor?.hex === color.hex ? null : color
                        );
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Selected color detail */}
              {selectedColor && (
                <ColorDetail
                  color={selectedColor}
                  className="mt-4"
                  eyedropperActive={eyedropperActive}
                  onEyedropper={() => {
                    if (eyedropperActive) {
                      setEyedropperActive(false);
                      setEyedropperTargetIndex(null);
                      setEyedropperPreview(null);
                    } else {
                      const idx = displayColors.findIndex(c => c.hex === selectedColor.hex);
                      if (idx === -1) return;
                      setEyedropperTargetIndex(idx);
                      setEyedropperActive(true);
                    }
                  }}
                />
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
