import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ExtractView } from "@/components/extract-view";

export const metadata = {
  title: "Extract Palette — ChromaMasters",
  description:
    "Upload any image and extract its dominant color palette using k-means clustering. All processing happens in your browser.",
};

export default function ExtractPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">
            Extract Palette
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload any image to extract its dominant colors. Discover which
            master painters share your color world.
          </p>
        </div>
        <ExtractView />
      </main>
      <Footer />
    </>
  );
}
