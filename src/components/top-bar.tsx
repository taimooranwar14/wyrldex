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

      <span className="ml-auto rounded-full border border-highlight/50 px-2.5 py-0.5 text-xs text-highlight">
        Unofficial fan project
      </span>
    </header>
  );
}
