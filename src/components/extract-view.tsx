"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { ColorSwatch } from "@/components/color-swatch";
import { ColorDetail } from "@/components/color-detail";
import { PaintingModal } from "@/components/painting-modal";
import {
  extractPalette,
  loadImageToCanvas,
  getRegionImageData,
} from "@/lib/color-extraction";
import { findSimilarPalettes } from "@/lib/palette-matching";
import {
  exportAsCSS,
  exportAsTailwind,
  exportAsPNG,
  exportAsASE,
  exportSideBySidePNG,
  downloadText,
  downloadBlob,
} from "@/lib/palette-export";
import { paintings } from "@/lib/data";
import type { Color, Painting } from "@/lib/types";

type RefineState = "off" | "selecting" | "done";

const SK_IMAGE = "chromamasters-extract-image";
const SK_PALETTE = "chromamasters-extract-palette";
const SK_COLORS = "chromamasters-extract-colorcount";

function saveToSession(imageDataUrl: string, palette: Color[], colorCount: number) {
  try {
    sessionStorage.setItem(SK_IMAGE, imageDataUrl);
    sessionStorage.setItem(SK_PALETTE, JSON.stringify(palette));
    sessionStorage.setItem(SK_COLORS, String(colorCount));
  } catch {
    // storage full or disabled — silently ignore
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SK_IMAGE);
    sessionStorage.removeItem(SK_PALETTE);
    sessionStorage.removeItem(SK_COLORS);
  } catch {
    // ignore
  }
}

function loadFromSession(): { image: string; palette: Color[]; colorCount: number } | null {
  try {
    const image = sessionStorage.getItem(SK_IMAGE);
    const palette = sessionStorage.getItem(SK_PALETTE);
    const colorCount = sessionStorage.getItem(SK_COLORS);
    if (image && palette) {
      return {
        image,
        palette: JSON.parse(palette),
        colorCount: colorCount ? parseInt(colorCount) : 8,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export function ExtractView() {
  // Image state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extraction state
  const [extractedColors, setExtractedColors] = useState<Color[]>([]);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [processing, setProcessing] = useState(false);
  const [numColors, setNumColors] = useState(8);

  // Refine region state
  const [refineState, setRefineState] = useState<RefineState>("off");
  const [regionStart, setRegionStart] = useState<{ x: number; y: number } | null>(null);
  const [regionRect, setRegionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Similar paintings
  const [similarPaintings, setSimilarPaintings] = useState<
    { painting: Painting; distance: number }[]
  >([]);
  const [modalPainting, setModalPainting] = useState<Painting | null>(null);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);

  // ── Restore from sessionStorage on mount ────────────────────────

  useEffect(() => {
    const saved = loadFromSession();
    if (!saved) return;

    setImageUrl(saved.image);
    setExtractedColors(saved.palette);
    setNumColors(saved.colorCount);

    // Rebuild canvas from the saved data URL so exports/refine still work
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      canvasRef.current = canvas;
    };
    img.src = saved.image;

    // Recompute similar paintings
    const matches = findSimilarPalettes(saved.palette, paintings, 5);
    setSimilarPaintings(matches);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File handling ─────────────────────────────────────────────────

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
        toast.error("Please upload a JPG, PNG, or WebP image.");
        return;
      }

      setProcessing(true);
      setExtractedColors([]);
      setSelectedColor(null);
      setSimilarPaintings([]);
      setRefineState("off");
      setRegionRect(null);
      setImageName(file.name.replace(/\.[^.]+$/, ""));

      try {
        const { canvas, imageData } = await loadImageToCanvas(file);
        canvasRef.current = canvas;

        // Display preview
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setImageUrl(dataUrl);

        // Run extraction (defer to next frame so loading indicator shows)
        await new Promise((r) => setTimeout(r, 50));
        const colors = extractPalette(imageData, numColors);
        setExtractedColors(colors);

        // Find similar paintings
        const matches = findSimilarPalettes(colors, paintings, 5);
        setSimilarPaintings(matches);

        // Persist to sessionStorage
        saveToSession(dataUrl, colors, numColors);
      } catch {
        toast.error("Failed to process image. Please try another file.");
      } finally {
        setProcessing(false);
      }
    },
    [numColors]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  // ── Re-extract with different color count ─────────────────────────

  function reExtract(count: number) {
    setNumColors(count);
    if (!canvasRef.current) return;
    setProcessing(true);
    setSelectedColor(null);

    requestAnimationFrame(() => {
      const canvas = canvasRef.current!;
      const sourceData =
        regionRect
          ? getRegionImageData(canvas, regionRect)
          : canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);

      const colors = extractPalette(sourceData, count);
      setExtractedColors(colors);
      const matches = findSimilarPalettes(colors, paintings, 5);
      setSimilarPaintings(matches);
      setProcessing(false);

      // Update sessionStorage with new palette/count
      if (imageUrl) saveToSession(imageUrl, colors, count);
    });
  }

  // ── Region select (refine mode) ───────────────────────────────────

  function getScaledCoords(e: React.MouseEvent): { x: number; y: number } {
    const container = imageContainerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }

  function handleImageMouseDown(e: React.MouseEvent) {
    if (refineState !== "selecting") return;
    e.preventDefault();
    setRegionStart(getScaledCoords(e));
    setRegionRect(null);
  }

  function handleImageMouseMove(e: React.MouseEvent) {
    if (refineState !== "selecting" || !regionStart) return;
    const curr = getScaledCoords(e);
    setRegionRect({
      x: Math.min(regionStart.x, curr.x),
      y: Math.min(regionStart.y, curr.y),
      width: Math.abs(curr.x - regionStart.x),
      height: Math.abs(curr.y - regionStart.y),
    });
  }

  function handleImageMouseUp() {
    if (refineState !== "selecting" || !regionRect) return;
    if (regionRect.width < 10 || regionRect.height < 10) {
      setRegionRect(null);
      setRegionStart(null);
      return;
    }
    setRegionStart(null);
    setRefineState("done");

    // Extract from region
    const canvas = canvasRef.current!;
    setProcessing(true);
    requestAnimationFrame(() => {
      const regionData = getRegionImageData(canvas, regionRect!);
      const colors = extractPalette(regionData, numColors);
      setExtractedColors(colors);
      const matches = findSimilarPalettes(colors, paintings, 5);
      setSimilarPaintings(matches);
      setProcessing(false);
    });
  }

  function resetRegion() {
    setRefineState("off");
    setRegionRect(null);
    setRegionStart(null);
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    setProcessing(true);
    requestAnimationFrame(() => {
      const imageData = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height);
      const colors = extractPalette(imageData, numColors);
      setExtractedColors(colors);
      const matches = findSimilarPalettes(colors, paintings, 5);
      setSimilarPaintings(matches);
      setProcessing(false);
    });
  }

  // ── Color copy ────────────────────────────────────────────────────

  function handleCopyColor(color: Color) {
    navigator.clipboard.writeText(color.hex.toUpperCase()).then(() => {
      toast(`Copied ${color.hex.toUpperCase()}`, {
        description: color.name,
        duration: 2000,
      });
    });
  }

  // ── Export handlers ───────────────────────────────────────────────

  const slug = imageName.toLowerCase().replace(/\s+/g, "-") || "extracted";

  async function handleExport(format: string) {
    switch (format) {
      case "css": {
        const css = exportAsCSS(extractedColors, imageName || "Extracted");
        downloadText(css, `${slug}-palette.css`);
        toast("CSS variables exported");
        break;
      }
      case "tailwind": {
        const tw = exportAsTailwind(extractedColors, imageName || "Extracted");
        downloadText(tw, `${slug}-palette.js`);
        toast("Tailwind config exported");
        break;
      }
      case "png": {
        const blob = await exportAsPNG(extractedColors, imageName || "Extracted");
        downloadBlob(blob, `${slug}-palette.png`);
        toast("PNG palette exported");
        break;
      }
      case "ase": {
        const buffer = exportAsASE(extractedColors, imageName || "Extracted");
        downloadBlob(buffer, `${slug}-palette.ase`);
        toast("ASE swatch file exported");
        break;
      }
      case "sidebyside": {
        if (!canvasRef.current) break;
        const blob = await exportSideBySidePNG(
          canvasRef.current,
          extractedColors,
          imageName || "Extracted"
        );
        downloadBlob(blob, `${slug}-sidebyside.png`);
        toast("Side-by-side PNG exported");
        break;
      }
    }
    setExportOpen(false);
  }

  // ── Region overlay style ──────────────────────────────────────────

  function getRegionOverlayStyle(): React.CSSProperties | undefined {
    if (!regionRect || !canvasRef.current || !imageContainerRef.current)
      return undefined;
    const container = imageContainerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    return {
      position: "absolute",
      left: regionRect.x * scaleX,
      top: regionRect.y * scaleY,
      width: regionRect.width * scaleX,
      height: regionRect.height * scaleY,
      border: "2px dashed rgba(255,255,255,0.8)",
      backgroundColor: "rgba(255,255,255,0.1)",
      pointerEvents: "none",
    };
  }

  // ── Render ────────────────────────────────────────────────────────

  // Drop zone (no image loaded yet)
  if (!imageUrl) {
    return (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border transition-colors hover:border-muted-foreground/50"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-4"
          style={{ color: "color-mix(in oklab, var(--muted-foreground) 40%, #6e6e6e)" }}
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-lg font-medium text-muted-foreground">
          Drop an image here or click to browse
        </p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          JPG, PNG, or WebP
        </p>
        <p className="mt-6 rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground/50">
          Your image never leaves your device — all processing happens in your
          browser.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Image + Palette Grid ──────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left: Image */}
        <div>
          <div
            ref={imageContainerRef}
            className={`relative overflow-hidden rounded-xl bg-muted ${refineState === "selecting" ? "cursor-crosshair" : ""
              }`}
            onMouseDown={handleImageMouseDown}
            onMouseMove={handleImageMouseMove}
            onMouseUp={handleImageMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Uploaded image"
              className="block w-full"
              draggable={false}
            />
            {regionRect && <div style={getRegionOverlayStyle()} />}
          </div>

          {/* Controls row under image */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setImageUrl(null);
                setExtractedColors([]);
                setSelectedColor(null);
                setSimilarPaintings([]);
                canvasRef.current = null;
                setRefineState("off");
                setRegionRect(null);
                clearSession();
              }}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Upload new image
            </button>

            {/* Refine toggle */}
            {extractedColors.length > 0 && (
              <>
                {refineState === "off" && (
                  <button
                    onClick={() => setRefineState("selecting")}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Refine region
                  </button>
                )}
                {refineState === "selecting" && (
                  <span className="text-xs text-muted-foreground">
                    Click and drag on the image to select a region...
                  </span>
                )}
                {refineState === "done" && (
                  <button
                    onClick={resetRegion}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Reset to full image
                  </button>
                )}
              </>
            )}
          </div>

          <p className="mt-3 text-xs text-muted-foreground/50">
            Your image never leaves your device — all processing happens in your
            browser.
          </p>
        </div>

        {/* Right: Palette */}
        <div>
          {processing && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Extracting colors...
              </p>
            </div>
          )}

          {!processing && extractedColors.length > 0 && (
            <div>
              {/* Header + export */}
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Extracted Palette
                </h3>
                {/* Export dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setExportOpen(!exportOpen)}
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
                    Export
                  </button>
                  {exportOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setExportOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-md border border-border bg-popover p-1 shadow-lg">
                        <button
                          onClick={() => handleExport("png")}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
                        >
                          PNG Strip
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
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => handleExport("sidebyside")}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
                        >
                          Side-by-Side PNG
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Color count slider + shuffle */}
              <div className="mb-4 flex items-center gap-3">
                <label className="text-xs text-muted-foreground">Colors:</label>
                <input
                  type="range"
                  min={5}
                  max={10}
                  value={numColors}
                  onChange={(e) => reExtract(parseInt(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-accent [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground"
                />
                <span className="w-5 text-center text-xs font-medium">
                  {numColors}
                </span>
                <button
                  onClick={() => reExtract(numColors)}
                  title="Shuffle — extract a different set of colors"
                  className="cursor-pointer rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </button>
              </div>

              {/* Palette grid */}
              <div className="grid grid-cols-4 gap-2">
                {extractedColors.map((color, i) => (
                  <ColorSwatch
                    key={`${color.hex}-${i}`}
                    color={color}
                    isSelected={selectedColor?.hex === color.hex}
                    onClick={() => {
                      setSelectedColor(color);
                      handleCopyColor(color);
                    }}
                  />
                ))}
              </div>

              {/* Selected color detail */}
              {selectedColor && (
                <ColorDetail color={selectedColor} className="mt-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Similar Palettes from the Masters ─────────────────────── */}
      {!processing && similarPaintings.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-serif text-xl font-bold">
            Similar palettes from the masters
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paintings with the most similar color palettes to your image.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {similarPaintings.map(({ painting, distance }) => (
              <button
                key={painting.id}
                onClick={() => setModalPainting(painting)}
                className="group flex cursor-pointer flex-col justify-start rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-muted-foreground/30"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={painting.image}
                    alt={painting.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 20vw"
                  />
                </div>

                {/* Info */}
                <p className="mt-2 text-sm font-semibold leading-tight">
                  {painting.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {painting.artist}, {painting.year}
                </p>

                {/* Painting palette strip */}
                <div className="mt-2 flex overflow-hidden rounded">
                  {painting.colors.map((c, i) => (
                    <div
                      key={i}
                      className="h-3 flex-1"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* Your palette strip for comparison */}
                <div className="mt-0.5 flex overflow-hidden rounded">
                  {extractedColors.map((c, i) => (
                    <div
                      key={i}
                      className="h-3 flex-1"
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {/* Match score */}
                <p className="mt-1.5 text-[10px] text-muted-foreground/60">
                  {distance < 10
                    ? "Very close match"
                    : distance < 18
                      ? "Close match"
                      : distance < 28
                        ? "Moderate match"
                        : "Loose match"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Painting modal for clicking matched paintings */}
      <PaintingModal
        painting={modalPainting}
        onClose={() => setModalPainting(null)}
      />
    </div>
  );
}
