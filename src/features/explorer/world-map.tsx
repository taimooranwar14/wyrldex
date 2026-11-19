import { useRef, useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import type { LocationSummary } from "@/features/locations/repository";
import { MapArt } from "./map-art";

type WorldMapProps = {
  regions: LocationSummary[]; // always drawn as labels, so the map keeps its bearings under any filter
  locations: LocationSummary[]; // currently visible results
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  pulse?: boolean; // AI results: draw attention to every visible pin
  className?: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DETAIL_ZOOM = 2; // below this, places are small dots so dense areas stay readable
const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const controlClass =
  "flex size-7 items-center justify-center text-base sm:size-9 sm:text-lg text-muted transition-colors hover:bg-violet/20 hover:text-foreground";

// Everything inside `layer` (art, labels, pins) shares one transform, so pins stay glued to the art.
// Pins and labels are counter-scaled, so they keep their size while the map zooms.
export function WorldMap({ regions, locations, selectedSlug, onSelect, pulse = false, className = "" }: WorldMapProps) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // Keep the map covering the frame: no dragging it off into empty space.
  function clamp(zoom: number, x: number, y: number) {
    const { width, height } = frame.current!.getBoundingClientRect();
    return {
      zoom,
      x: Math.min(0, Math.max(width * (1 - zoom), x)),
      y: Math.min(0, Math.max(height * (1 - zoom), y)),
    };
  }

  // Zoom around a point given as 0–1 fractions of the map (default: the centre of what you see).
  function zoomTo(zoom: number, focus?: { x: number; y: number }) {
    const { width, height } = frame.current!.getBoundingClientRect();
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    const fx = focus ? focus.x * width * view.zoom + view.x : width / 2;
    const fy = focus ? focus.y * height * view.zoom + view.y : height / 2;
    const scale = next / view.zoom;
    const target = focus ? { x: width / 2, y: height / 2 } : { x: fx, y: fy };
    setView(clamp(next, target.x - (fx - view.x) * scale, target.y - (fy - view.y) * scale));
  }

  const visible = new Set(locations.map((loc) => loc.slug));
  const places = locations.filter((loc) => loc.category !== "Region");
  const detailed = view.zoom >= DETAIL_ZOOM;
  const counter = { transform: `scale(${1 / view.zoom})` };

  return (
    <div
      ref={frame}
      className={`relative aspect-[10/7] touch-none overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"} rounded-2xl border border-border shadow-[0_0_40px_-10px] shadow-violet/40 ${className}`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return; // let pins and controls handle their own clicks
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, panX: view.x, panY: view.y };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        setView(clamp(view.zoom, drag.current.panX + e.clientX - drag.current.x, drag.current.panY + e.clientY - drag.current.y));
      }}
      onPointerUp={() => {
        drag.current = null;
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
    >
      <div
        className={`absolute inset-0 origin-top-left ${dragging ? "" : "transition-transform duration-300 ease-out"}`}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
      >
        <MapArt />

        {regions.map((region) => {
          const lit = visible.has(region.slug) || region.slug === selectedSlug;
          return (
            <button
              key={region.slug}
              type="button"
              aria-label={`${region.name} (region)`}
              aria-pressed={region.slug === selectedSlug}
              onClick={() => {
                onSelect(region.slug);
                // Zoom to the middle of the region's visible places (labels sit beside their clusters).
                const inside = places.filter((place) => place.region === region.name);
                const focus = inside.length
                  ? { x: avg(inside.map((p) => p.x)), y: avg(inside.map((p) => p.y)) }
                  : region;
                zoomTo(Math.max(view.zoom, 2.5), focus);
              }}
              className="absolute"
              // Labels near the west edge start at their point instead of centring on it, so they are not cut off.
              style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, transform: `translate(${region.x < 0.2 ? "-15%" : "-50%"}, -50%)` }}
            >
              <span
                className={`block whitespace-nowrap px-1 font-semibold uppercase tracking-[0.25em] transition-colors ${
                  lit ? "text-glow text-foreground" : "text-foreground/40"
                } ${region.slug === "vice-city" ? "text-[10px] sm:text-sm" : "text-[7px] sm:text-[10px]"}`}
                style={counter}
              >
                {region.name}
              </span>
            </button>
          );
        })}

        {places.map((loc) => {
          const isSelected = loc.slug === selectedSlug;
          const big = detailed || isSelected;
          return (
            <button
              key={loc.slug}
              type="button"
              aria-label={`${loc.name}, ${loc.category}`}
              aria-pressed={isSelected}
              onClick={() => onSelect(loc.slug)}
              className="group absolute size-0"
              style={{ left: `${loc.x * 100}%`, top: `${loc.y * 100}%`, zIndex: isSelected ? 20 : 10 }}
            >
              <span className="absolute bottom-0 left-0 block origin-bottom-left" style={counter}>
                {big ? (
                  // Teardrop pin: a rotated square with three rounded corners, tip on the location.
                  <span
                    className={`absolute bottom-0 flex -translate-x-1/2 items-center justify-center ${isSelected ? "size-10" : "size-8"}`}
                  >
                    {pulse && (
                      <span className="absolute size-full rounded-full bg-highlight/40 motion-safe:animate-ping" aria-hidden />
                    )}
                    <span
                      className={`absolute inset-0 -rotate-45 rounded-[50%_50%_50%_0] border bg-gradient-to-br shadow-[0_0_16px_2px] ${
                        isSelected
                          ? "border-accent from-highlight to-violet shadow-accent/60"
                          : "border-highlight/70 from-highlight/90 to-violet/80 shadow-highlight/50"
                      }`}
                    />
                    <CategoryIcon category={loc.category} className={`relative text-white ${isSelected ? "size-5" : "size-4"}`} />
                  </span>
                ) : (
                  <span className="absolute -bottom-1.5 -left-1.5 flex size-3 items-center justify-center">
                    {pulse && <span className="absolute size-full rounded-full bg-highlight/60 motion-safe:animate-ping" aria-hidden />}
                    <span className="size-2 rounded-full bg-highlight shadow-[0_0_10px_3px] shadow-highlight/60 transition-transform group-hover:scale-150" />
                  </span>
                )}

                {/* Callout: always for the selected place, on hover or keyboard focus for others. */}
                <span
                  className={`pointer-events-none absolute left-0 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-surface/90 px-2.5 py-1 text-left shadow-lg backdrop-blur ${
                    big ? "bottom-12" : "bottom-3"
                  } ${isSelected ? "block border-accent/60" : "hidden border-border group-hover:block group-focus-visible:block"}`}
                >
                  <span className="block text-xs font-medium text-foreground">{loc.name}</span>
                  {isSelected && <span className="block text-[10px] text-muted">{[loc.category, loc.region].filter(Boolean).join(" · ")}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Map controls */}
      <div className="absolute right-2 bottom-2 flex flex-col sm:right-3 sm:bottom-3 overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur">
        <button type="button" aria-label="Zoom in" onClick={() => zoomTo(view.zoom * 1.5)} className={controlClass}>
          +
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomTo(view.zoom / 1.5)} className={controlClass}>
          −
        </button>
        <button type="button" aria-label="Reset view" onClick={() => setView({ zoom: 1, x: 0, y: 0 })} className={controlClass}>
          ⤢
        </button>
      </div>
    </div>
  );
}
