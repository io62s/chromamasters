export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="h-4 w-1 rounded-full bg-rose-500/60" />
              <div className="h-4 w-1 rounded-full bg-amber-500/60" />
              <div className="h-4 w-1 rounded-full bg-emerald-500/60" />
              <div className="h-4 w-1 rounded-full bg-blue-500/60" />
            </div>
            <span className="font-serif text-sm font-semibold text-muted-foreground">
              ChromaMasters
            </span>
            <span className="ml-4">&copy; 2026 ChromaMasters</span>
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
