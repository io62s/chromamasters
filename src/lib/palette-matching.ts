import chroma from "chroma-js";
import type { Color, Painting } from "./types";

interface PaletteMatch {
  painting: Painting;
  distance: number;
}

/**
 * Calculate average Delta-E between two palettes.
 * For each color in palette A, find the closest match in palette B,
 * then average all minimum distances.
 */
function paletteDistance(a: Color[], b: Color[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;

  let totalDist = 0;

  // A→B direction
  for (const colorA of a) {
    let minDist = Infinity;
    for (const colorB of b) {
      const d = chroma.deltaE(colorA.hex, colorB.hex);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
  }

  // B→A direction (symmetric)
  for (const colorB of b) {
    let minDist = Infinity;
    for (const colorA of a) {
      const d = chroma.deltaE(colorA.hex, colorB.hex);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
  }

  return totalDist / (a.length + b.length);
}

/**
 * Find the top N paintings whose palettes are most similar
 * to the given extracted palette.
 */
export function findSimilarPalettes(
  extractedColors: Color[],
  allPaintings: Painting[],
  topN = 5
): PaletteMatch[] {
  const matches: PaletteMatch[] = allPaintings.map((painting) => ({
    painting,
    distance: paletteDistance(extractedColors, painting.colors),
  }));

  matches.sort((a, b) => a.distance - b.distance);

  return matches.slice(0, topN);
}
