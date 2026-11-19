"use client";

import { useCallback, useState } from "react";
import { DetailPanel } from "@/components/detail-panel";
import { AskPanel } from "@/features/ai/ask-panel";
import { suggestForCharacter, suggestQuestions } from "@/features/ai/suggestions";
import { CollectionsPanel } from "@/features/collections/collections-panel";
import { useCollections, type Collection } from "@/features/collections/store";
import { buildGraph, type GraphNode } from "@/features/graph/build";
import type { CharacterSummary } from "@/features/graph/repository";
import { WorldGraph } from "@/features/graph/world-graph";
import type { LocationSummary } from "@/features/locations/repository";
import { useLocationSearch } from "./use-location-search";
import { WorldMap } from "./world-map";

// Results shown on the map instead of everything: an AI answer, a character's places, or a collection.
type Highlight = { label: string; locations: LocationSummary[]; collectionId?: string };

type ExplorerProps = { locations: LocationSummary[]; characters: CharacterSummary[]; liveAI: boolean };

export function Explorer({ locations, characters, liveAI }: ExplorerProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [characterSlug, setCharacterSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const search = useLocationSearch(query);
  const store = useCollections();

  // Derived on every render, never stored: one source of truth, nothing to keep in sync.
  const bySlug = new Map(locations.map((loc) => [loc.slug, loc]));
  const categories = [...new Set(locations.map((loc) => loc.category))].sort();
  const regions = locations.filter((loc) => loc.category === "Region");
  const base = highlight?.locations ?? search.results ?? locations;
  const visible = category ? base.filter((loc) => loc.category === category) : base;
  // Region labels stay on the map under any filter, so they stay selectable too.
  const selected = selectedSlug ? (bySlug.get(selectedSlug) ?? null) : null;
  const character = characters.find((c) => c.slug === characterSlug) ?? null;
  const connected = new Set(characters.flatMap((c) => c.connections.map((link) => link.location.slug)));
  const suggestions = character ? suggestForCharacter(character) : suggestQuestions(selected, connected);
  const graph = buildGraph(locations, characters, { character, location: selected });
  const placesOf = (slugs: string[]) => slugs.flatMap((slug) => bySlug.get(slug) ?? []);

  function show(next: Highlight | null) {
    setHighlight(next);
    setCharacterSlug(null);
    setSelectedSlug(next?.locations[0]?.slug ?? null);
  }

  function selectPlace(slug: string | null) {
    setSelectedSlug(slug);
    setCharacterSlug(null);
    // Picking something outside the highlighted set means the user moved on: show everything again.
    if (slug && highlight && !highlight.locations.some((loc) => loc.slug === slug)) setHighlight(null);
  }

  function pickNode(node: GraphNode) {
    const [kind, slug] = node.id.split(":");
    if (kind === "character") {
      const person = characters.find((c) => c.slug === slug)!;
      setHighlight({ label: `Connected to ${person.name}`, locations: placesOf(person.connections.map((l) => l.location.slug)) });
      setSelectedSlug(null);
      setCharacterSlug(slug);
    } else if (kind === "location") {
      selectPlace(slug);
    } else {
      show(null); // the "Leonida" hub resets everything
    }
  }

  // Stable identity: the Ask panel calls this from an effect, which must not re-run on every render.
  const onAiResult = useCallback(
    (found: LocationSummary[] | null) => {
      setHighlight(found ? { label: "AI highlighted", locations: found } : null);
      setCharacterSlug(null);
      if (found) setSelectedSlug(found[0].slug);
    },
    [],
  );

  const statusText =
    locations.length === 0
      ? "No locations in this world yet."
      : highlight
        ? `${highlight.label} · ${visible.length} ${visible.length === 1 ? "place" : "places"}`
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
              setHighlight(null); // typing a search replaces any highlight
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
          {highlight && (
            <button type="button" onClick={() => show(null)} className="text-xs text-accent underline underline-offset-2">
              Show all
            </button>
          )}
        </div>

        {/* On desktop this box is a size container, so the map can fit inside it like object-fit: contain. */}
        <div className="flex flex-1 items-center justify-center lg:min-h-0 lg:[container-type:size]">
          <WorldMap
            regions={regions}
            locations={visible}
            selectedSlug={selected?.slug ?? null}
            onSelect={selectPlace}
            fitTo={highlight?.locations ?? null}
            pulse={highlight !== null}
            className="w-full lg:w-[min(100cqw,142.857cqh)]"
          />
        </div>

        <p className="truncate font-mono text-[11px] text-muted">
          Original stylized map, not to scale · scroll or double-click to zoom · drag to pan · Esc to deselect
        </p>

        <div className="grid grid-cols-1 gap-3 lg:h-52 lg:shrink-0 lg:grid-cols-2">
          <WorldGraph graph={graph} onPick={pickNode} />
          <CollectionsPanel
            collections={store.collections}
            activeId={highlight?.collectionId ?? null}
            selected={selected}
            nameOf={(slug) => bySlug.get(slug)?.name ?? slug}
            onCreate={(name) => store.create(name, selected ? [selected.slug] : [])}
            onShow={(c: Collection) => show({ label: `Collection “${c.name}”`, locations: placesOf(c.slugs), collectionId: c.id })}
            onAdd={(id, slug) => {
              store.add(id, slug);
              // Keep the map in step when adding to the collection that is on screen.
              if (highlight?.collectionId === id) setHighlight({ ...highlight, locations: [...highlight.locations, bySlug.get(slug)!] });
            }}
            onRemoveSlug={(id, slug) => {
              store.removeSlug(id, slug);
              if (highlight?.collectionId === id) setHighlight({ ...highlight, locations: highlight.locations.filter((l) => l.slug !== slug) });
            }}
            onDelete={(id) => {
              store.remove(id);
              if (highlight?.collectionId === id) show(null);
            }}
            onPick={selectPlace}
          />
        </div>
      </main>

      <DetailPanel location={selected} character={character} placeName={(slug) => bySlug.get(slug)?.name ?? slug}>
        <AskPanel
          live={liveAI}
          onResult={onAiResult}
          suggestions={suggestions}
          onSaveResults={(name, slugs) => store.create(name, slugs)}
        />
      </DetailPanel>
    </>
  );
}
