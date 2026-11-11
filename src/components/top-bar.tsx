import { brand } from "@/lib/brand";

export function TopBar() {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border bg-surface/80 px-4 py-3 lg:col-span-3">
      <div className="flex items-baseline gap-3">
        <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
        <span className="hidden font-mono text-xs uppercase tracking-widest text-accent sm:inline">
          {brand.experience}
        </span>
      </div>

      <input
        type="search"
        aria-label="Search locations"
        placeholder="Search locations — coming soon"
        disabled
        className="order-last w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm placeholder:text-muted disabled:opacity-60 sm:order-none sm:ml-auto sm:w-72"
      />

      <span className="ml-auto rounded-full border border-highlight/50 px-2.5 py-0.5 text-xs text-highlight sm:ml-0">
        Sample data
      </span>
    </header>
  );
}
