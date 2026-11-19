import { describe, expect, it } from "vitest";
import { artBox, centerOn, clampView, fitPoints, HOME, isInView, toFrame, zoomAt } from "./map-view";

describe("map camera", () => {
  it("never lets the map leave the frame or zoom past its limits", () => {
    expect(clampView({ zoom: 9, x: 5, y: -50 })).toEqual({ zoom: 4, x: 0, y: -3 });
    expect(clampView({ zoom: 0.1, x: -1, y: 1 })).toEqual(HOME);
  });

  it("keeps the point under the cursor fixed while zooming", () => {
    const view = zoomAt(HOME, 2, { x: 0.25, y: 0.75 });
    // The map point at (0.25, 0.75) is still drawn at screen (0.25, 0.75).
    expect(0.25 * view.zoom + view.x).toBeCloseTo(0.25);
    expect(0.75 * view.zoom + view.y).toBeCloseTo(0.75);
  });

  it("centres a point, clamping at the map edge", () => {
    expect(centerOn({ x: 0.5, y: 0.5 }, 2)).toEqual({ zoom: 2, x: -0.5, y: -0.5 });
    expect(centerOn({ x: 0.95, y: 0.5 }, 2).x).toBe(-1); // cannot scroll past the right edge
  });

  it("fits a cluster of points and keeps them all in view", () => {
    const points = [{ x: 0.55, y: 0.6 }, { x: 0.65, y: 0.7 }];
    const view = fitPoints(points);
    expect(view.zoom).toBeGreaterThan(2);
    expect(points.every((p) => isInView(view, p))).toBe(true);
    expect(fitPoints([])).toEqual(HOME);
  });

  it("centres the 10:7 art inside a frame of any shape", () => {
    expect(artBox(1000, 700)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    const wide = artBox(2000, 700); // art is half the width, centred
    expect(wide).toEqual({ x: 0.25, y: 0, width: 0.5, height: 1 });
    expect(toFrame(wide, { x: 1, y: 0.5 })).toEqual({ x: 0.75, y: 0.5 });
    expect(artBox(700, 1000).height).toBeCloseTo(0.49); // tall phone frame: art is full width
    expect(artBox(0, 0)).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
});
