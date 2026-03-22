import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ExtractView } from "@/components/extract-view";
import { movements, getMovementPaintings } from "@/lib/data";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            Extract Your Color Palette
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload any image to extract its dominant colors. Discover which
            master painters share your color world.
          </p>
        </section>

        {/* Extract View */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <ExtractView />
        </section>

        {/* Discover preview */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight">
                Palettes from the masters
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Curated color palettes from masterpiece paintings across art history.
              </p>
            </div>
            <Link
              href="/movements"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {movements.map((movement) => {
              const paintings = getMovementPaintings(movement.id);
              const previewColors = paintings
                .slice(0, 6)
                .flatMap((p) => p.colors.slice(0, 2))
                .slice(0, 8);

              return (
                <Link
                  key={movement.id}
                  href={`/movement/${movement.slug}`}
                  className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-foreground/20 hover:bg-accent/50 p-3"
                >
                  <div className="flex h-[5px]">
                    {previewColors.map((color, i) => (
                      <div
                        key={i}
                        className="flex-1"
                        style={{ backgroundColor: color.hex }}
                      />
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">
                      {movement.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paintings.length} paintings
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
