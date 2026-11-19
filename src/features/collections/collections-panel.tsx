import { useState } from "react";
import type { LocationSummary } from "@/features/locations/repository";
import type { Collection } from "./store";

type CollectionsPanelProps = {
  collections: Collection[];
  activeId: string | null;
  selected: LocationSummary | null;
  nameOf: (slug: string) => string;
  onCreate: (name: string) => void;
  onShow: (collection: Collection) => void;
  onAdd: (id: string, slug: string) => void;
  onRemoveSlug: (id: string, slug: string) => void;
  onDelete: (id: string) => void;
  onPick: (slug: string) => void;
};

export function CollectionsPanel(props: CollectionsPanelProps) {
  const { collections, activeId, selected, nameOf, onCreate, onShow, onAdd, onRemoveSlug, onDelete, onPick } = props;
  const [name, setName] = useState("");

  return (
    <section aria-labelledby="collections-heading" className="flex min-h-0 flex-col rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="collections-heading" className="text-sm font-semibold">
          Collections
        </h2>
        <p className="text-xs text-muted">Saved in this browser only</p>
      </div>

      <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto">
        {collections.length === 0 && (
          <li className="text-xs text-muted">Save places into your own lists: create one below, or save an AI answer.</li>
        )}
        {collections.map((c) => {
          const active = c.id === activeId;
          const canAdd = selected && !c.slugs.includes(selected.slug);
          return (
            <li key={c.id} className={`rounded-xl border p-2.5 ${active ? "border-accent/60 bg-accent/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onShow(c)} className="min-w-0 flex-1 text-left" aria-pressed={active}>
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="text-[11px] text-muted">
                    {c.slugs.length} {c.slugs.length === 1 ? "place" : "places"} · {active ? "shown on map" : "show on map"}
                  </span>
                </button>
                {canAdd && (
                  <button
                    type="button"
                    onClick={() => onAdd(c.id, selected.slug)}
                    className="shrink-0 rounded-full border border-accent/50 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/10"
                  >
                    + {selected.name}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Delete collection ${c.name}`}
                  onClick={() => onDelete(c.id)}
                  className="shrink-0 rounded-full px-1.5 text-muted hover:text-highlight"
                >
                  ×
                </button>
              </div>
              {active && c.slugs.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {c.slugs.map((slug) => (
                    <li key={slug} className="flex items-center rounded-full border border-border text-[11px]">
                      <button type="button" onClick={() => onPick(slug)} className="py-0.5 pr-1 pl-2 hover:text-accent">
                        {nameOf(slug)}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${nameOf(slug)} from ${c.name}`}
                        onClick={() => onRemoveSlug(c.id, slug)}
                        className="pr-2 text-muted hover:text-highlight"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name);
          setName("");
        }}
      >
        <input
          type="text"
          aria-label="New collection name"
          placeholder={selected ? `New list with ${selected.name}…` : "New collection name…"}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-8 min-w-0 flex-1 rounded-md border border-border bg-background/80 px-3 text-xs placeholder:text-muted"
        />
        <button type="submit" className="min-h-8 rounded-md bg-violet px-3 text-xs font-medium text-white disabled:opacity-50" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </section>
  );
}
