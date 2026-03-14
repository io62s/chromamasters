"use client";

import { useState } from "react";
import { PaintingCard } from "@/components/painting-card";
import { PaintingModal } from "@/components/painting-modal";
import type { Painting } from "@/lib/types";

export function PaintingGrid({ paintings }: { paintings: Painting[] }) {
  const [selectedPainting, setSelectedPainting] = useState<Painting | null>(
    null
  );

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {paintings.map((painting) => (
          <PaintingCard
            key={painting.id}
            painting={painting}
            onClick={() => setSelectedPainting(painting)}
          />
        ))}
      </div>

      <PaintingModal
        painting={selectedPainting}
        onClose={() => setSelectedPainting(null)}
      />
    </>
  );
}
