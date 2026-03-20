import chroma from "chroma-js";
import type { Color } from "./types";

// ── Types ──────────────────────────────────────────────────────────────

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Cluster {
  centroid: RGB;
  pixels: RGB[];
}

// ── K-Means Clustering ────────────────────────────────────────────────

function randomCentroids(pixels: RGB[], k: number): RGB[] {
  const shuffled = [...pixels].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, k);
}

function distance(a: RGB, b: RGB): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function assignClusters(pixels: RGB[], centroids: RGB[]): Cluster[] {
  const clusters: Cluster[] = centroids.map((c) => ({
    centroid: c,
    pixels: [],
  }));

  for (const pixel of pixels) {
    let minDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < centroids.length; i++) {
      const d = distance(pixel, centroids[i]);
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }
    clusters[bestIdx].pixels.push(pixel);
  }

  return clusters;
}

function recalcCentroids(clusters: Cluster[]): RGB[] {
  return clusters.map((cluster) => {
    if (cluster.pixels.length === 0) return cluster.centroid;
    const sum = cluster.pixels.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    );
    const n = cluster.pixels.length;
    return {
      r: Math.round(sum.r / n),
      g: Math.round(sum.g / n),
      b: Math.round(sum.b / n),
    };
  });
}

function kMeans(pixels: RGB[], k: number, maxIter = 20): RGB[] {
  let centroids = randomCentroids(pixels, k);

  for (let i = 0; i < maxIter; i++) {
    const clusters = assignClusters(pixels, centroids);
    const newCentroids = recalcCentroids(clusters);

    // Check convergence
    const moved = newCentroids.some(
      (nc, idx) => distance(nc, centroids[idx]) > 1
    );
    centroids = newCentroids;
    if (!moved) break;
  }

  return centroids;
}

// ── Post-processing ───────────────────────────────────────────────────

/** Merge clusters that are too similar (Delta-E < threshold) */
function deduplicateColors(hexColors: string[], minDeltaE = 10): string[] {
  const result: string[] = [hexColors[0]];

  for (let i = 1; i < hexColors.length; i++) {
    const isDuplicate = result.some(
      (existing) => chroma.deltaE(existing, hexColors[i]) < minDeltaE
    );
    if (!isDuplicate) {
      result.push(hexColors[i]);
    }
  }

  return result;
}

/** Sort colors by hue for visual coherence */
function sortByHue(hexColors: string[]): string[] {
  return [...hexColors].sort((a, b) => {
    const hA = chroma(a).hsl()[0] || 0;
    const hB = chroma(b).hsl()[0] || 0;
    return hA - hB;
  });
}

// ── Pixel Sampling ────────────────────────────────────────────────────

function samplePixels(imageData: ImageData, maxSamples = 10000): RGB[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(totalPixels / maxSamples));
  const pixels: RGB[] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const offset = i * 4;
    const a = data[offset + 3];
    // Skip transparent pixels
    if (a < 128) continue;
    pixels.push({
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    });
  }

  return pixels;
}

// ── Region extraction ─────────────────────────────────────────────────

export function getRegionImageData(
  canvas: HTMLCanvasElement,
  region: { x: number; y: number; width: number; height: number }
): ImageData {
  const ctx = canvas.getContext("2d")!;
  return ctx.getImageData(region.x, region.y, region.width, region.height);
}

// ── Name assignment ───────────────────────────────────────────────────

function assignColorName(hex: string): string {
  const c = chroma(hex);
  const [h, s, l] = c.hsl();
  const hue = h || 0;
  const sat = s || 0;

  // Achromatic
  if (sat < 0.1 || isNaN(hue)) {
    if (l < 0.15) return "Black";
    if (l < 0.35) return "Dark Gray";
    if (l < 0.65) return "Gray";
    if (l < 0.85) return "Light Gray";
    return "White";
  }

  // Chromatic — name by hue
  const hueNames: [number, string][] = [
    [15, "Red"],
    [40, "Orange"],
    [65, "Yellow"],
    [80, "Yellow Green"],
    [150, "Green"],
    [185, "Teal"],
    [210, "Cyan"],
    [250, "Blue"],
    [280, "Indigo"],
    [310, "Purple"],
    [340, "Pink"],
    [360, "Red"],
  ];

  let baseName = "Red";
  for (const [boundary, name] of hueNames) {
    if (hue < boundary) {
      baseName = name;
      break;
    }
  }

  // Add lightness modifier
  if (l < 0.3) return `Dark ${baseName}`;
  if (l > 0.75) return `Light ${baseName}`;
  return baseName;
}

// ── Main extraction function ──────────────────────────────────────────

export function extractPalette(
  imageData: ImageData,
  numColors = 8
): Color[] {
  const pixels = samplePixels(imageData);
  if (pixels.length === 0) return [];

  // Run k-means with extra clusters to allow dedup headroom
  const extraK = Math.min(numColors * 2, pixels.length);
  const centroids = kMeans(pixels, extraK);

  // Convert to hex
  let hexColors = centroids.map((c) =>
    chroma(c.r, c.g, c.b).hex()
  );

  // Sort by luminance (darkest first) for consistent ordering before dedup
  hexColors.sort((a, b) => chroma(a).luminance() - chroma(b).luminance());

  // Deduplicate, progressively lowering threshold until we have enough colors
  let deduped = deduplicateColors(hexColors, 10);
  if (deduped.length < numColors) {
    deduped = deduplicateColors(hexColors, 5);
  }
  if (deduped.length < numColors) {
    deduped = deduplicateColors(hexColors, 2);
  }
  if (deduped.length < numColors) {
    deduped = hexColors; // skip dedup entirely
  }
  hexColors = deduped;

  // Take requested number
  hexColors = hexColors.slice(0, numColors);

  // Sort by hue for the final palette
  hexColors = sortByHue(hexColors);

  // Map to Color objects
  return hexColors.map((hex) => ({
    hex,
    name: assignColorName(hex),
  }));
}

/** Draw an image file onto a hidden canvas and return the canvas + imageData */
export function loadImageToCanvas(
  file: File
): Promise<{ canvas: HTMLCanvasElement; imageData: ImageData }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Limit to max 800px on longest side for performance
      const maxDim = 800;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      resolve({ canvas, imageData });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
