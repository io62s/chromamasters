import Link from "next/link";
import { getMovementPaintings } from "@/lib/data";
import type { Movement } from "@/lib/types";

export function MovementCard({ movement }: { movement: Movement }) {
  const paintings = getMovementPaintings(movement.id);
  const previewColors = paintings
    .slice(0, 4)
    .flatMap((p) => p.colors.slice(0, 2))
    .slice(0, 8);

  return (
    <Link
      href={`/movement/${movement.slug}`}
      className="group block rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
    >
      {/* Color preview strip */}
      <div className="mb-4 flex h-3 overflow-hidden rounded-full">
        {previewColors.map((color, i) => (
          <div
            key={i}
            className="flex-1 transition-all group-hover:flex-[1.2]"
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>

      <h3 className="font-serif text-lg font-semibold">{movement.name}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {movement.period} &middot; {movement.yearStart}–{movement.yearEnd}
      </p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {movement.description}
      </p>
      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {paintings.length} painting{paintings.length !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
