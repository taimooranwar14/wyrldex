import { useSyncExternalStore } from "react";

// Collections live in this browser only (localStorage): the public demo has no accounts, so nothing is written to
// the database and the AI stays read-only. The user creates and fills every collection with their own clicks.
// shortcut: per-browser only; move to the database once there are user accounts.
export type Collection = { id: string; name: string; slugs: string[] };

const KEY = "wyrldex.collections.v1";
const EMPTY: Collection[] = [];

// Storage is untrusted (old versions, manual edits, other scripts): keep only well-formed entries.
export function parseCollections(raw: string | null): Collection[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(
      (c): c is Collection =>
        typeof c?.id === "string" &&
        typeof c?.name === "string" &&
        Array.isArray(c?.slugs) &&
        c.slugs.every((slug: unknown) => typeof slug === "string"),
    );
  } catch {
    return [];
  }
}

let cache: Collection[] | null = null;
const listeners = new Set<() => void>();

function read(): Collection[] {
  if (cache) return cache;
  try {
    cache = parseCollections(localStorage.getItem(KEY));
  } catch {
    cache = []; // storage blocked (private mode, sandboxed preview)
  }
  return cache;
}

function write(next: Collection[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory copy for this visit.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCollections() {
  // The server snapshot is empty, so server HTML and first client render match; saved lists appear right after.
  const collections = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    collections,
    create(name: string, slugs: string[] = []) {
      // Not crypto.randomUUID: it only exists on https/localhost, and the app is also tested from phones over plain LAN http.
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      write([...read(), { id, name: name.trim().slice(0, 60), slugs: [...new Set(slugs)] }]);
    },
    add(id: string, slug: string) {
      write(read().map((c) => (c.id === id && !c.slugs.includes(slug) ? { ...c, slugs: [...c.slugs, slug] } : c)));
    },
    removeSlug(id: string, slug: string) {
      write(read().map((c) => (c.id === id ? { ...c, slugs: c.slugs.filter((s) => s !== slug) } : c)));
    },
    remove(id: string) {
      write(read().filter((c) => c.id !== id));
    },
  };
}
