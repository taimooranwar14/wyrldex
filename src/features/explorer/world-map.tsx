import type { LocationSummary } from "@/features/locations/repository";

type WorldMapProps = {
  locations: LocationSummary[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  pulse?: boolean; // AI results: draw attention to every visible pin
  className?: string;
};

// Original, invented coastline (viewBox 1000×700). Pins are HTML buttons laid over it,
// positioned in % so they line up with the SVG at any size (the wrapper keeps the 10:7 ratio).
export function WorldMap({ locations, selectedSlug, onSelect, pulse = false, className = "" }: WorldMapProps) {
  return (
    <div className={`relative aspect-[10/7] ${className}`}>
      <svg viewBox="0 0 1000 700" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#13213a" />
            <stop offset="1" stopColor="#0c1424" />
          </linearGradient>
        </defs>
        <g
          fill="url(#land)"
          className="stroke-accent/60 [filter:drop-shadow(0_0_6px_rgb(45_212_212/0.35))]"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        >
          {/* Mainland with an eastern bay and a southern tip */}
          <path d="M90,60 C200,30 320,55 450,40 C560,28 650,50 700,90 C720,140 690,170 705,210 C720,260 700,300 690,340 C640,360 600,330 580,380 C560,430 620,470 640,500 C650,560 560,600 500,620 C450,640 420,690 380,680 C330,660 300,600 260,600 C180,600 120,640 70,600 C30,560 50,480 40,420 C30,330 70,260 50,180 C40,120 50,80 90,60 Z" />
          {/* Offshore islands */}
          <ellipse cx={830} cy={255} rx={60} ry={35} />
          <ellipse cx={870} cy={450} rx={40} ry={60} />
          {/* Keys trailing off the southern tip */}
          <ellipse cx={320} cy={665} rx={18} ry={7} />
          <ellipse cx={270} cy={655} rx={18} ry={7} />
          <ellipse cx={220} cy={662} rx={16} ry={6} />
          <ellipse cx={170} cy={672} rx={14} ry={5} />
        </g>
        {/* Inland lagoon and a highway, drawn faintly */}
        <ellipse cx={240} cy={420} rx={70} ry={40} className="fill-background stroke-accent/30" strokeWidth={1} />
        <path
          d="M130,110 C250,160 380,260 470,400 S560,560 520,600"
          className="fill-none stroke-highlight/25"
          strokeWidth={2}
          strokeDasharray="6 8"
        />
        <text x={400} y={330} textAnchor="middle" className="fill-foreground/[0.07] font-mono text-[56px] tracking-[0.4em]">
          LEONIDA
        </text>
        {/* Compass */}
        <g transform="translate(930 90)" className="fill-none stroke-muted/60" strokeWidth={1}>
          <circle r={26} />
          <path d="M0,-34 L5,0 L0,34 L-5,0 Z" className="fill-muted/30" />
          <text y={-40} textAnchor="middle" className="fill-muted stroke-none font-mono text-[12px]">N</text>
        </g>
      </svg>

      {locations.map((loc) => {
        const isSelected = loc.slug === selectedSlug;

        return (
          <button
            key={loc.slug}
            type="button"
            aria-label={loc.name}
            aria-pressed={isSelected}
            onClick={() => onSelect(loc.slug)}
            className="group absolute flex size-7 -translate-1/2 items-center justify-center rounded-full"
            style={{ left: `${loc.x * 100}%`, top: `${loc.y * 100}%` }}
          >
            {pulse && (
              <span className="absolute size-4 rounded-full bg-highlight/50 motion-safe:animate-ping" aria-hidden />
            )}
            <span
              className={`rounded-full transition-all ${
                isSelected
                  ? "size-4 bg-highlight shadow-[0_0_20px_6px] shadow-highlight/60"
                  : "size-2.5 bg-accent shadow-[0_0_12px_3px] shadow-accent/50 group-hover:size-3.5"
              }`}
            />
            {/* Label shows when selected, hovered or keyboard-focused. It sits on the side facing the map's centre,
                so it never runs off a narrow screen. */}
            <span
              className={`pointer-events-none absolute whitespace-nowrap rounded border border-border bg-surface/90 px-2 py-0.5 text-xs backdrop-blur ${
                loc.x > 0.5 ? "right-full mr-1" : "left-full ml-1"
              } ${isSelected ? "block" : "hidden group-hover:block group-focus-visible:block"}`}
            >
              {loc.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
