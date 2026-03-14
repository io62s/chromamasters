import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovementCard } from "@/components/movement-card";
import { movements } from "@/lib/data";
import type { Period } from "@/lib/types";

const periodOrder: Period[] = ["Renaissance", "Baroque", "19th Century", "Modern"];

export default function Home() {
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
        {/* Hero */}
        <section className="border-b border-border bg-gradient-to-b from-background to-accent/20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              Fine Art Color Palettes
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Explore curated 8-color palettes extracted from masterpiece
              paintings across art history. Click any color to copy its hex
              code, or export entire palettes for your creative projects.
            </p>
          </div>
        </section>

        {/* Movement Cards */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
