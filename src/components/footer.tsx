import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">&copy; 2026 ChromaMasters</span>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            <p>
              All painting images sourced from open-access museum collections.
              Color palettes curated for digital artists.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
