import { useEffect, useRef, useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import type { LocationSummary } from "@/features/locations/repository";
import { MapArt } from "./map-art";
import { artBox, centerOn, clampView, fitPoints, HOME, isInView, toFrame, zoomAt, type MapView } from "./map-view";

type WorldMapProps = {
  regions: LocationSummary[]; // always drawn as labels, so the map keeps its bearings under any filter
  locations: LocationSummary[]; // currently visible results
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  fitTo?: LocationSummary[] | null; // when this list changes (AI answer, collection, character), zoom to show it
  pulse?: boolean; // highlighted results: draw attention to every visible pin
  className?: string;
};

const DETAIL_ZOOM = 2; // below this, places are small dots so dense areas stay readable
const avg = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const controlClass =
  "flex size-7 items-center justify-center text-base sm:size-9 sm:text-lg text-muted transition-colors hover:bg-violet/20 hover:text-foreground";

// Everything inside the layer (art, labels, pins) shares one transform, so pins stay glued to the art.
// Pins and labels are counter-scaled, so they keep their size while the map zooms.
export function WorldMap({ regions, locations, selectedSlug, onSelect, fitTo = null, pulse = false, className = "" }: WorldMapProps) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; view: MapView } | null>(null);
  const [view, setView] = useState<MapView>(HOME);
  const [dragging, setDragging] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  // Where the art sits inside the frame, for camera maths. CSS places the art itself, so first paint is right
  // even before this is measured.
  const [box, setBox] = useState(() => artBox(1, 1 / (10 / 7)));

  // React to new results or a new selection by moving the camera. Adjusting state during render (not in an effect)
  // is React's recommended pattern for "when this prop changes, update that state".
  const [seen, setSeen] = useState({ fitTo, selectedSlug });
  if (seen.fitTo !== fitTo || seen.selectedSlug !== selectedSlug) {
    setSeen({ fitTo, selectedSlug });
    const selected = locations.find((loc) => loc.slug === selectedSlug && loc.category !== "Region");
    if (seen.fitTo !== fitTo && fitTo?.length) setView(fitPoints(fitTo.map((p) => toFrame(box, p))));
    else if (selected && !isInView(view, toFrame(box, selected))) setView(centerOn(toFrame(box, selected), Math.max(view.zoom, 2.5)));
  }

  // Pointer position as a 0–1 fraction of the frame.
  const toFraction = (clientX: number, clientY: number) => {
    const rect = frame.current!.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  // Wheel zoom needs a non-passive listener to stop the page scrolling, which React's onWheel cannot do.
  useEffect(() => {
    const el = frame.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const point = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
      setView((v) => zoomAt(v, v.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), point));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = frame.current!;
    const observer = new ResizeObserver(() => setBox(artBox(el.clientWidth, el.clientHeight)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // In full screen, make everything behind the map inert, so keyboard focus cannot wander onto hidden buttons.
  useEffect(() => {
    if (!fullScreen) return;
    const hidden: Element[] = [];
    for (let el: Element | null = frame.current; el && el !== document.body; el = el.parentElement) {
      for (const sibling of el.parentElement?.children ?? []) {
        if (sibling !== el && !sibling.hasAttribute("inert")) {
          sibling.setAttribute("inert", "");
          hidden.push(sibling);
        }
      }
    }
    return () => hidden.forEach((el) => el.removeAttribute("inert"));
  }, [fullScreen]);

  // Escape leaves full screen first, then closes the selection (like closing a callout).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (fullScreen) setFullScreen(false);
      else onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect, fullScreen]);

  const visible = new Set(locations.map((loc) => loc.slug));
  const places = locations.filter((loc) => loc.category !== "Region");
  const detailed = view.zoom >= DETAIL_ZOOM;
  const counter = { transform: `scale(${1 / view.zoom})` };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={frame}
      // Full screen is a fixed overlay rather than the Fullscreen API, which iPhone Safari does not support for pages.
      className={`${fullScreen ? "fixed inset-0 z-50" : "relative size-full rounded-2xl border border-border"} touch-none overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"} bg-[radial-gradient(circle_at_60%_60%,#1a1040,#0a0714_75%)] shadow-[0_0_40px_-10px] shadow-violet/40 ${className}`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) return; // let pins and controls handle their own clicks
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, view };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const start = drag.current.view;
        setView(
          clampView({
            ...start,
            x: start.x + (e.clientX - drag.current.x) / rect.width,
            y: start.y + (e.clientY - drag.current.y) / rect.height,
          }),
        );
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        setView(zoomAt(view, view.zoom * 2, toFraction(e.clientX, e.clientY)));
      }}
    >
      <div
        className={`absolute inset-0 origin-top-left [container-type:size] ${dragging ? "" : "transition-transform duration-500 ease-out"}`}
        // Percent translate is relative to the layer itself, which is exactly the frame's size.
        style={{ transform: `translate(${view.x * 100}%, ${view.y * 100}%) scale(${view.zoom})` }}
      >
        {/* The art box: 10:7, as large as fits, centred (object-fit: contain via container units). */}
        <div className="absolute top-1/2 left-1/2 aspect-[10/7] w-[min(100cqw,142.857cqh)] -translate-1/2">
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
                  setView(centerOn(toFrame(box, focus), Math.max(view.zoom, 2.5)));
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
      </div>

      <p className="pointer-events-none absolute bottom-2 left-3 font-mono text-[10px] text-muted/80">
        Original stylized map · positions are illustrative
      </p>

      {/* Map controls */}
      <div className="absolute right-2 bottom-2 flex flex-col sm:right-3 sm:bottom-3 overflow-hidden rounded-xl border border-border bg-surface/80 backdrop-blur">
        <button
          type="button"
          aria-label={fullScreen ? "Exit full screen" : "Full screen map"}
          aria-pressed={fullScreen}
          title={fullScreen ? "Exit full screen (Esc)" : "Full screen map"}
          onClick={() => setFullScreen(!fullScreen)}
          className={controlClass}
        >
          <ControlIcon d={fullScreen ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"} />
        </button>
        <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => setView(zoomAt(view, view.zoom * 1.5))} className={controlClass}>
          <ControlIcon d="M12 5v14M5 12h14" />
        </button>
        <button type="button" aria-label="Zoom out" title="Zoom out" onClick={() => setView(zoomAt(view, view.zoom / 1.5))} className={controlClass}>
          <ControlIcon d="M5 12h14" />
        </button>
        <button type="button" aria-label="Show the whole map" title="Show the whole map" onClick={() => setView(HOME)} className={controlClass}>
          <ControlIcon d="M3 11l9-7 9 7M5 10v10h14V10" />
        </button>
      </div>
    </div>
  );
}

const ControlIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
