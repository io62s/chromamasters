import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Sidebar } from "@/components/sidebar";
import { AllPaintingsView } from "@/components/all-paintings-view";
import { paintings, movements } from "@/lib/data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Paintings - ChromaMasters",
  description:
    "Browse all paintings and their color palettes across every art movement.",
};

export default function PaintingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-4 py-[40px] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-serif text-3xl font-bold sm:text-4xl">
              All Paintings
            </h1>
            <p className="mt-2 text-muted-foreground">
              {paintings.length} paintings across {movements.length} movements
            </p>
            <Suspense fallback={<div className="mt-6 text-muted-foreground">Loading...</div>}>
              <AllPaintingsView
                paintings={paintings}
                movements={movements}
              />
            </Suspense>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
