// Map camera maths. Positions are fractions (0–1) of the map frame, so a resize never leaves the view out of bounds.
// `x`/`y` are the layer's offset; a map point p appears on screen at p * zoom + offset.
export type MapView = { zoom: number; x: number; y: number };
type Point = { x: number; y: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const HOME: MapView = { zoom: 1, x: 0, y: 0 };

// Keep the map covering the frame: zoom within limits, no dragging it off into empty space.
export function clampView({ zoom, x, y }: MapView): MapView {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  return { zoom: z, x: Math.min(0, Math.max(1 - z, x)), y: Math.min(0, Math.max(1 - z, y)) };
}

// Zoom while keeping the map point under `screen` (e.g. the cursor) where it is.
export function zoomAt(view: MapView, zoom: number, screen: Point = { x: 0.5, y: 0.5 }): MapView {
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  const mapX = (screen.x - view.x) / view.zoom;
  const mapY = (screen.y - view.y) / view.zoom;
  return clampView({ zoom: z, x: screen.x - mapX * z, y: screen.y - mapY * z });
}

// Put a map point in the middle of the frame at the given zoom.
export function centerOn(point: Point, zoom: number): MapView {
  return clampView({ zoom, x: 0.5 - point.x * zoom, y: 0.5 - point.y * zoom });
}

// Smallest view that shows every point with some margin, never zoomed in more than 3×.
export function fitPoints(points: Point[]): MapView {
  if (points.length === 0) return HOME;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 0.2;
  const center = { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 };
  return centerOn(center, Math.min(3, 1 / span));
}

export function isInView(view: MapView, point: Point, margin = 0.05): boolean {
  const sx = point.x * view.zoom + view.x;
  const sy = point.y * view.zoom + view.y;
  return sx > margin && sx < 1 - margin && sy > margin && sy < 1 - margin;
}

// The art keeps its 10:7 shape and is centred inside a frame of any shape (like object-fit: contain), while the sea
// fills the rest. This gives the art's box as fractions of the frame, so camera maths can use frame fractions.
export const ART_RATIO = 10 / 7;
export type ArtBox = { x: number; y: number; width: number; height: number };

export function artBox(frameWidth: number, frameHeight: number): ArtBox {
  if (frameWidth <= 0 || frameHeight <= 0) return { x: 0, y: 0, width: 1, height: 1 };
  const width = Math.min(1, (frameHeight * ART_RATIO) / frameWidth);
  const height = Math.min(1, frameWidth / ART_RATIO / frameHeight);
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

// A point on the art (0–1 of the art) as a fraction of the frame.
export const toFrame = (box: ArtBox, p: Point): Point => ({ x: box.x + p.x * box.width, y: box.y + p.y * box.height });
