import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Sidebar } from "@/components/sidebar";
import { PaintingGrid } from "@/components/painting-grid";
import { movements, getMovement, getMovementPaintings } from "@/lib/data";
import type { Metadata } from "next";

export function generateStaticParams() {
  return movements.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const movement = getMovement(slug);
  if (!movement) return {};
  return {
    title: `${movement.name} — ChromaMasters`,
    description: movement.description,
  };
}

export default async function MovementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const movement = getMovement(slug);
  if (!movement) notFound();

  const paintings = getMovementPaintings(movement.id);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Movement header */}
            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {movement.period}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">
                {movement.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {movement.yearStart}–{movement.yearEnd}
              </p>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                {movement.description}
              </p>
            </div>

            {/* Paintings grid */}
            <PaintingGrid paintings={paintings} />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
