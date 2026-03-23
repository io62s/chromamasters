import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovementCard } from "@/components/movement-card";
import { movements } from "@/lib/data";
import type { Metadata, } from "next";
import type { Period } from "@/lib/types";

const periodOrder: Period[] = ["Renaissance", "Baroque", "19th Century", "Modern"];

export const metadata: Metadata = {
  title: "Movements - ChromaMasters",
  description:
    "Browse art movements and their curated color palettes across art history.",
};

export default function MovementsPage() {
  const grouped = periodOrder
    .map((period) => ({
      period,
      movements: movements.filter((m) => m.period === period),
    }))
    .filter((g) => g.movements.length > 0);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 py-[40px]">
          <div className="mx-auto max-w-7xl px-8">
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Art Movements
            </h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
              Explore curated color palettes from masterpiece paintings across
              art history. Click any movement to browse its paintings and
              palettes.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-8 py-12">
          {grouped.map(({ period, movements: periodMovements }) => (
            <div key={period} className="mb-12 last:mb-0">
              <h2 className="mb-6 font-serif text-2xl font-semibold">
                {period}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {periodMovements.map((movement) => (
                  <MovementCard key={movement.id} movement={movement} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
