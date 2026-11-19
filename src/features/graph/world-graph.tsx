import { useState } from "react";
import { CategoryIcon } from "@/components/category-icon";
import type { Graph, GraphNode } from "./build";

const ring: Record<GraphNode["kind"], string> = {
  world: "border-foreground/60 bg-surface text-foreground",
  region: "border-violet bg-violet/20 text-violet",
  place: "border-accent bg-accent/15 text-accent",
  character: "border-highlight bg-highlight/20 text-highlight",
};

const initials = (name: string) => name.split(" ").map((part) => part[0]).join("").slice(0, 2);

// Radial graph: the focus in the middle, linked nodes around it. Nodes are HTML buttons over an SVG of lines,
// like the map pins, so they are keyboard-accessible.
export function WorldGraph({ graph, onPick }: { graph: Graph; onPick: (node: GraphNode) => void }) {
  const [hovered, setHovered] = useState<GraphNode | null>(null);
  const n = graph.neighbors.length;
  // Neighbours sit on an ellipse (in % of the box), starting at the top and going clockwise.
  const spots = graph.neighbors.map((node, i) => {
    // One or two nodes sit left and right; more are offset by half a step. Either way none lands on the centre's label.
    const angle = n <= 2 ? i * Math.PI : -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n;
    // Rounded: trig can differ in the last digits between engines, which would break hydration.
    return { node, x: Math.round(500 + 400 * Math.cos(angle)) / 10, y: Math.round(470 + 360 * Math.sin(angle)) / 10 };
  });

  return (
    <section aria-labelledby="graph-heading" className="flex min-h-0 flex-col rounded-2xl border border-border bg-surface/70 p-4 backdrop-blur">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="graph-heading" className="text-sm font-semibold">
          World Graph
        </h2>
        <p className="truncate text-xs text-muted">Centred on {graph.center.label}</p>
      </div>

      <div className="relative mt-1 min-h-40 flex-1 lg:min-h-0">
        <svg className="absolute inset-0 size-full" aria-hidden>
          {spots.map(({ node, x, y }) => (
            <line
              key={node.id}
              x1="50%"
              y1="47%"
              x2={`${x}%`}
              y2={`${y}%`}
              className={hovered?.id === node.id ? "stroke-accent" : "stroke-violet/50"}
              strokeWidth={1.5}
            />
          ))}
        </svg>

        <GraphButton node={graph.center} x={50} y={47} big onPick={onPick} onHover={setHovered} />
        {spots.map(({ node, x, y }) => (
          <GraphButton key={node.id} node={node} x={x} y={y} onPick={onPick} onHover={setHovered} />
        ))}
        {n === 0 && <p className="absolute inset-x-0 bottom-0 text-center text-xs text-muted">No sourced links yet.</p>}
      </div>

      {/* The reason for a link, shown for the hovered or focused node. */}
      <p aria-live="polite" className="mt-1 min-h-4 truncate text-xs text-muted">
        {hovered?.note ?? "Hover or focus a node to see why it is linked. Click to explore it."}
      </p>
    </section>
  );
}

type GraphButtonProps = {
  node: GraphNode;
  x: number;
  y: number;
  big?: boolean;
  onPick: (node: GraphNode) => void;
  onHover: (node: GraphNode | null) => void;
};

function GraphButton({ node, x, y, big = false, onPick, onHover }: GraphButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onPick(node)}
      onMouseEnter={() => onHover(node)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node)}
      onBlur={() => onHover(null)}
      aria-label={`${node.label} (${node.kind})${node.note ? `: ${node.note}` : ""}`}
      className="group absolute flex -translate-1/2 flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={`flex items-center justify-center rounded-full border-2 font-semibold shadow-[0_0_14px_-2px] shadow-current transition-transform group-hover:scale-110 ${ring[node.kind]} ${
          big ? "size-14 text-sm" : "size-9 text-[10px]"
        }`}
      >
        {node.kind === "character" || node.kind === "world" ? (
          initials(node.label)
        ) : (
          <CategoryIcon category={node.category ?? "Region"} className={big ? "size-6" : "size-4"} />
        )}
      </span>
      <span className={`max-w-24 truncate text-center leading-tight ${big ? "text-xs font-medium" : "text-[10px] text-muted"}`}>
        {node.label}
      </span>
    </button>
  );
}
