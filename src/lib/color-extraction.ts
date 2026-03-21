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

/** K-means++ initialization — picks spread-out centroids, biased toward vivid pixels */
function kMeansPlusPlusCentroids(pixels: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [];

  // First centroid: pick the most saturated pixel to anchor on color
  let bestFirst = 0;
  let bestSat = 0;
  for (let i = 0; i < pixels.length; i++) {
    const s = pixelSaturation(pixels[i]);
    if (s > bestSat) {
      bestSat = s;
      bestFirst = i;
    }
  }
  centroids.push(pixels[bestFirst]);

  // Remaining centroids: weighted by distance squared to nearest centroid
  const dist = new Float64Array(pixels.length).fill(Infinity);
  for (let c = 1; c < k; c++) {
    const lastC = centroids[c - 1];
    let totalWeight = 0;
    for (let i = 0; i < pixels.length; i++) {
      const d = distance(pixels[i], lastC);
      if (d < dist[i]) dist[i] = d;
      totalWeight += dist[i];
    }
    // Weighted random selection
    let r = Math.random() * totalWeight;
    let chosen = 0;
    for (let i = 0; i < pixels.length; i++) {
      r -= dist[i];
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push(pixels[chosen]);
  }

  return centroids;
}

function pixelSaturation(p: RGB): number {
  const max = Math.max(p.r, p.g, p.b);
  const min = Math.min(p.r, p.g, p.b);
  if (max === 0) return 0;
  return (max - min) / max;
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

function kMeans(pixels: RGB[], k: number, maxIter = 20): Cluster[] {
  let centroids = kMeansPlusPlusCentroids(pixels, k);
  let clusters: Cluster[] = [];

  for (let i = 0; i < maxIter; i++) {
    clusters = assignClusters(pixels, centroids);
    const newCentroids = recalcCentroids(clusters);

    // Check convergence
    const moved = newCentroids.some(
      (nc, idx) => distance(nc, centroids[idx]) > 1
    );
    centroids = newCentroids;
    if (!moved) break;
  }

  return clusters;
}

/** Saturation-weighted average: biases toward vivid pixels without picking outliers */
function vividRepresentatives(clusters: Cluster[]): RGB[] {
  return clusters.map((cluster) => {
    if (cluster.pixels.length === 0) return cluster.centroid;

    let totalW = 0;
    let sumR = 0, sumG = 0, sumB = 0;

    for (const px of cluster.pixels) {
      // Weight: 1 for muted pixels, up to 3 for fully saturated
      const w = 1 + pixelSaturation(px) * 2;
      sumR += px.r * w;
      sumG += px.g * w;
      sumB += px.b * w;
      totalW += w;
    }

    return {
      r: Math.round(sumR / totalW),
      g: Math.round(sumG / totalW),
      b: Math.round(sumB / totalW),
    };
  });
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
    const px: RGB = {
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    };
    pixels.push(px);
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
  const extraK = Math.min(numColors * 4, pixels.length);
  const clusters = kMeans(pixels, extraK);

  // Pick the most vivid pixel from each cluster instead of the average
  const representatives = vividRepresentatives(clusters);

  // Convert to hex
  let hexColors = representatives.map((c) =>
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

  // Guarantee the most saturated color from the image is represented.
  // K-means averaging tends to wash out small vivid regions.
  let peakSatHex: string | null = null;
  let peakSat = 0;
  for (const px of pixels) {
    const s = chroma(px.r, px.g, px.b).hsl()[1] || 0;
    if (s > peakSat) {
      peakSat = s;
      peakSatHex = chroma(px.r, px.g, px.b).hex();
    }
  }
  if (peakSatHex && peakSat > 0.3) {
    const alreadyPresent = hexColors.some(
      (h) => chroma.deltaE(h, peakSatHex!) < 15
    );
    if (!alreadyPresent) {
      // Replace the least saturated color in the palette
      let minIdx = 0;
      let minSat = Infinity;
      for (let i = 0; i < hexColors.length; i++) {
        const s = chroma(hexColors[i]).hsl()[1] || 0;
        if (s < minSat) {
          minSat = s;
          minIdx = i;
        }
      }
      hexColors[minIdx] = peakSatHex;
    }
  }

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
