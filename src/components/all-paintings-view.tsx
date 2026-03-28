"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaintingCard } from "@/components/painting-card";
import { PaintingModal } from "@/components/painting-modal";
import type { Painting, Movement } from "@/lib/types";

type SortOption = "year-asc" | "year-desc" | "artist" | "movement";

interface AllPaintingsViewProps {
  paintings: Painting[];
  movements: Movement[];
}

export function AllPaintingsView({
  paintings,
  movements,
}: AllPaintingsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movementFilter = searchParams.get("movement") || "all";
  const periodFilter = searchParams.get("period") || "all";
  const sortBy = (searchParams.get("sort") as SortOption) || "year-asc";

  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(
    null
  );

  const periods = useMemo(
    () => [...new Set(movements.map((m) => m.period))],
    [movements]
  );

  const filteredMovements = useMemo(
    () =>
      periodFilter === "all"
        ? movements
        : movements.filter((m) => m.period === periodFilter),
    [movements, periodFilter]
  );

  const filteredAndSorted = useMemo(() => {
    let result = [...paintings];

    if (periodFilter !== "all") {
      const movementIds = movements
        .filter((m) => m.period === periodFilter)
        .map((m) => m.id);
      result = result.filter((p) => movementIds.includes(p.movementId));
    }

    if (movementFilter !== "all") {
      result = result.filter((p) => p.movementId === movementFilter);
    }

    switch (sortBy) {
      case "year-asc":
        result.sort((a, b) => a.year - b.year);
        break;
      case "year-desc":
        result.sort((a, b) => b.year - a.year);
        break;
      case "artist":
        result.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case "movement":
        result.sort((a, b) => a.movementId.localeCompare(b.movementId));
        break;
    }

    return result;
  }, [paintings, movements, periodFilter, movementFilter, sortBy]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "year-asc") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset movement filter when period changes
    if (key === "period") {
      params.delete("movement");
    }
    const query = params.toString();
    router.push(query ? `?${query}` : "/paintings", { scroll: false });
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={periodFilter}
          onChange={(e) => updateParam("period", e.target.value)}
          className=" border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All Periods</option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={movementFilter}
          onChange={(e) => updateParam("movement", e.target.value)}
          className=" border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value="all">All Movements</option>
          {filteredMovements.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => updateParam("sort", e.target.value)}
          className=" border border-border bg-background px-3 py-1.5 text-sm text-foreground"
        >
          <option value="year-asc">Year (Oldest)</option>
          <option value="year-desc">Year (Newest)</option>
          <option value="artist">Artist (A–Z)</option>
          <option value="movement">Movement</option>
        </select>

        <span className="flex items-center text-xs text-muted-foreground">
          {filteredAndSorted.length} painting
          {filteredAndSorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filteredAndSorted.map((painting) => (
          <PaintingCard
            key={painting.id}
            painting={painting}
            onClick={() => setSelectedPainting(painting)}
          />
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No paintings match your filters.
        </p>
      )}

      <PaintingModal
        painting={selectedPainting}
        onClose={() => setSelectedPainting(null)}
      />
    </>
  );
}
