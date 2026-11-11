"use client";

import { useState } from "react";
import { DetailPanel } from "@/components/detail-panel";
import type { LocationSummary } from "@/features/locations/repository";
import { WorldMap } from "./world-map";

export function Explorer({ locations }: { locations: LocationSummary[] }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  // Derived on every render, never stored: one source of truth, nothing to keep in sync.
  const categories = [...new Set(locations.map((loc) => loc.category))].sort();
  const visible = category ? locations.filter((loc) => loc.category === category) : locations;
  const selected = visible.find((loc) => loc.slug === selectedSlug) ?? null;

  return (
    // Fragment: <main> and <aside> stay direct children of the page's grid.
    <>
      <main id="main" className="grid-lines flex flex-1 flex-col gap-3 p-4 lg:min-h-0">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {[null, ...categories].map((cat) => (
            <button
              key={cat ?? "all"}
              type="button"
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
              className={`min-h-8 rounded-full border px-3 text-xs transition-colors ${
                category === cat
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface/70 text-muted hover:text-foreground"
              }`}
            >
              {cat ?? "All"}
            </button>
          ))}
        </div>

        {/* On desktop this box is a size container, so the map can fit inside it like object-fit: contain. */}
        <div className="flex flex-1 items-center justify-center lg:min-h-0 lg:[container-type:size]">
          <WorldMap
            locations={visible}
            selectedSlug={selected?.slug ?? null}
            onSelect={setSelectedSlug}
            className="w-full lg:w-[min(100cqw,142.857cqh)]"
          />
        </div>

        {locations.length === 0 && (
          <p role="status" className="text-sm text-muted">No locations in this world yet.</p>
        )}

        <p className="font-mono text-[11px] text-muted">
          Original stylized map — not to scale. Positions are illustrative, not in-game coordinates.
        </p>
      </main>

      <DetailPanel location={selected} />
    </>
  );
}
