import movementsData from "@/data/movements.json";
import paintingsData from "@/data/paintings.json";
import baroqueData from "@/data/paintings-baroque.json";
import realismData from "@/data/paintings-realism.json";
import postImpData from "@/data/paintings-post-impressionism.json";
import artNouveauData from "@/data/paintings-art-nouveau.json";
import preRaphData from "@/data/paintings-pre-raphaelite.json";
import type { Movement, Painting, Period } from "./types";

export const movements: Movement[] = movementsData as Movement[];
export const paintings: Painting[] = [
  ...paintingsData,
  ...baroqueData,
  ...realismData,
  ...postImpData,
  ...artNouveauData,
  ...preRaphData,
] as Painting[];

export function getMovement(slug: string): Movement | undefined {
  return movements.find((m) => m.slug === slug);
}

export function getMovementPaintings(movementId: string): Painting[] {
  return paintings.filter((p) => p.movementId === movementId);
}

export function getPainting(id: string): Painting | undefined {
  return paintings.find((p) => p.id === id);
}

export function getPeriods(): Period[] {
  const periodOrder: Period[] = ["Renaissance", "Baroque", "19th Century", "Modern"];
  const existing = new Set(movements.map((m) => m.period));
  return periodOrder.filter((p) => existing.has(p));
}

export function getMovementsByPeriod(period: string): Movement[] {
  return movements.filter((m) => m.period === period);
}

export function getAllPaintings(): Painting[] {
  return paintings;
}
