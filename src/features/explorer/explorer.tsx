"use client";

import { useState } from "react";
import { DetailPanel } from "@/components/detail-panel";
import { AskPanel } from "@/features/ai/ask-panel";
import type { LocationSummary } from "@/features/locations/repository";
import { useLocationSearch } from "./use-location-search";
import { WorldMap } from "./world-map";

export function Explorer({ locations, liveAI }: { locations: LocationSummary[]; liveAI: boolean }) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const search = useLocationSearch(query);
  const [aiLocations, setAiLocations] = useState<LocationSummary[] | null>(null);

  // Derived on every render, never stored: one source of truth, nothing to keep in sync.
  const categories = [...new Set(locations.map((loc) => loc.category))].sort();
  const base = aiLocations ?? search.results ?? locations;
  const visible = category ? base.filter((loc) => loc.category === category) : base;
  // After an AI answer, show its first location until the user picks another pin.
  const selected = visible.find((loc) => loc.slug === selectedSlug) ?? (aiLocations ? (visible[0] ?? null) : null);

  const statusText =
    locations.length === 0
      ? "No locations in this world yet."
      : aiLocations
        ? `AI highlighted ${visible.length} ${visible.length === 1 ? "location" : "locations"}`
        : search.status === "loading"
        ? "Searching…"
        : search.status === "error"
          ? "Search failed — try again."
          : search.results && visible.length === 0
            ? `No locations match “${query.trim()}”.`
            : search.results
              ? `${visible.length} ${visible.length === 1 ? "location" : "locations"} found`
              : "";

  return (
    // Fragment: <main> and <aside> stay direct children of the page's grid.
    <>
      <main id="main" className="grid-lines flex flex-1 flex-col gap-3 p-4 lg:min-h-0">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            aria-label="Search locations"
            placeholder="Search locations…"
            maxLength={100}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiLocations(null); // typing a search replaces the AI's highlight
            }}
            className="min-h-8 w-full rounded-md border border-border bg-background/80 px-3 text-sm placeholder:text-muted sm:w-64"
          />
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
        </div>

        {/* Always rendered so screen readers announce changes; min-h stops the layout jumping. */}
        <div className="flex min-h-4 items-center gap-3">
          <p role="status" className="text-xs text-muted">
            {statusText}
          </p>
          {aiLocations && (
            <button type="button" onClick={() => setAiLocations(null)} className="text-xs text-accent underline underline-offset-2">
              Show all
            </button>
          )}
        </div>

        {/* On desktop this box is a size container, so the map can fit inside it like object-fit: contain. */}
        <div className="flex flex-1 items-center justify-center lg:min-h-0 lg:[container-type:size]">
          <WorldMap
            locations={visible}
            selectedSlug={selected?.slug ?? null}
            onSelect={setSelectedSlug}
            pulse={aiLocations !== null}
            className="w-full lg:w-[min(100cqw,142.857cqh)]"
          />
        </div>

        <p className="font-mono text-[11px] text-muted">
          Original stylized map — not to scale. Positions are illustrative, not in-game coordinates.
        </p>
      </main>

      <DetailPanel location={selected}>
        <AskPanel live={liveAI} onResult={setAiLocations} />
      </DetailPanel>
    </>
  );
}
