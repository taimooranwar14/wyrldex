import { useEffect, useState } from "react";
import type { LocationSummary } from "@/features/locations/repository";

const DEBOUNCE_MS = 250;

type SearchState =
  | { status: "idle"; results: LocationSummary[] | null } // results is null when the box is empty
  | { status: "loading" | "error"; results: null };

// Searches GET /api/locations as the user types.
// Covered end to end by scripts/smoke.mjs (search, then clearing it).
export function useLocationSearch(query: string): SearchState {
  const q = query.trim();
  // Each response is stored with the query it answers, so it can never be shown for a different query.
  const [response, setResponse] = useState<{ q: string; locations: LocationSummary[] | null } | null>(null);

  useEffect(() => {
    if (!q) return; // Empty box means "no filter": no request at all.

    const controller = new AbortController();
    // Wait until typing pauses; each keystroke cancels the previous timer via the cleanup below.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/locations?${new URLSearchParams({ q })}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Search failed with HTTP ${res.status}`);
        const body: { locations: LocationSummary[] } = await res.json();
        setResponse({ q, locations: body.locations });
      } catch {
        // An abort is us cancelling a stale request, not a failure.
        if (!controller.signal.aborted) setResponse({ q, locations: null });
      }
    }, DEBOUNCE_MS);

    // Cleanup: runs before the next effect (query changed) and on unmount.
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  if (!q) return { status: "idle", results: null };
  if (response?.q !== q) return { status: "loading", results: null };
  return response.locations ? { status: "idle", results: response.locations } : { status: "error", results: null };
}
