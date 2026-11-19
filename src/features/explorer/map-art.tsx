// Original neon-night artwork for the stylized Leonida map (viewBox 1000×700). Static: no props, no state.
// Not traced from any official map; shapes are invented and only loosely follow the regions' described layout.

const MAINLAND =
  "M90,60 C200,30 320,55 450,40 C560,28 650,50 700,90 C720,140 690,170 705,210 C720,260 700,300 690,340 C640,360 600,330 580,380 C560,430 620,470 640,500 C650,560 560,600 500,620 C450,640 420,690 380,680 C330,660 300,600 260,600 C180,600 120,640 70,600 C30,560 50,480 40,420 C30,330 70,260 50,180 C40,120 50,80 90,60 Z";

const ISLANDS = [
  { cx: 652, cy: 458, rx: 16, ry: 62, transform: "rotate(-12 652 458)" }, // barrier island with the beach strip
  { cx: 830, cy: 255, rx: 60, ry: 35 },
  { cx: 870, cy: 450, rx: 40, ry: 60 },
  { cx: 320, cy: 665, rx: 18, ry: 7 },
  { cx: 270, cy: 655, rx: 18, ry: 7 },
  { cx: 220, cy: 662, rx: 16, ry: 6 },
  { cx: 170, cy: 672, rx: 14, ry: 5 },
];

const HIGHWAYS = [
  "M95,210 C200,190 300,150 420,110", // Port Gellhorn to Mount Kalaga
  "M420,110 C470,220 540,330 575,470", // Kalaga south to Vice City
  "M95,210 C180,280 250,330 310,365 S480,440 575,470", // west coast through Ambrosia to Vice City
  "M575,470 C560,540 520,580 470,610 S380,660 320,665 S220,668 170,672", // Vice City down the Keys
  "M310,365 C330,440 380,520 400,560", // Ambrosia into Grassrivers
];

// Deterministic pseudo-random lights, so server and browser render the same picture.
function cityLights() {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const clusters = [
    { x: 575, y: 465, r: 85, n: 220 }, // Vice City
    { x: 95, y: 210, r: 40, n: 45 }, // Port Gellhorn
    { x: 315, y: 360, r: 30, n: 25 }, // Ambrosia
    { x: 230, y: 655, r: 45, n: 18 }, // Keys
  ];
  const colors = ["#fde68a", "#f0abfc", "#67e8f9", "#f9a8d4"];
  return clusters.flatMap(({ x, y, r, n }) =>
    Array.from({ length: n }, () => {
      // Pick points in the square until one lands in the disc. Plain arithmetic only: Math.sin/cos can differ
      // slightly between browser engines, which would break hydration.
      let dx: number, dy: number;
      do {
        dx = rand() * 2 - 1;
        dy = rand() * 2 - 1;
      } while (dx * dx + dy * dy > 1);
      return {
        cx: Math.round(x + dx * r),
        cy: Math.round(y + dy * r * 0.8),
        r: 0.8 + rand() * 1.6,
        fill: colors[Math.floor(rand() * colors.length)],
        opacity: 0.45 + rand() * 0.5,
      };
    }),
  );
}
const LIGHTS = cityLights();

export function MapArt() {
  return (
    <svg viewBox="0 0 1000 700" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <radialGradient id="sea" cx="0.6" cy="0.6" r="0.8">
          <stop offset="0" stopColor="#1a1040" />
          <stop offset="1" stopColor="#0a0714" />
        </radialGradient>
        <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d1638" />
          <stop offset="1" stopColor="#120c26" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="land-clip">
          <path d={MAINLAND} />
        </clipPath>
      </defs>

      <rect width="1000" height="700" fill="url(#sea)" />

      {/* Shallow-water rings around the coast */}
      {[1.06, 1.03].map((scale) => (
        <path
          key={scale}
          d={MAINLAND}
          fill="none"
          stroke="#22d3ee"
          strokeOpacity={0.08}
          strokeWidth={2}
          transform={`translate(${380 * (1 - scale)} ${350 * (1 - scale)}) scale(${scale})`}
        />
      ))}

      {/* Land with a violet halo and a crisp cyan coastline */}
      <g filter="url(#glow)">
        <path d={MAINLAND} fill="url(#land)" stroke="#a855f7" strokeOpacity={0.5} strokeWidth={6} />
        {ISLANDS.map((island) => (
          <ellipse key={island.cx} {...island} fill="url(#land)" stroke="#a855f7" strokeOpacity={0.5} strokeWidth={4} />
        ))}
      </g>
      <path d={MAINLAND} fill="none" stroke="#22d3ee" strokeOpacity={0.8} strokeWidth={1.2} />
      {ISLANDS.map((island) => (
        <ellipse key={island.cx} {...island} fill="none" stroke="#22d3ee" strokeOpacity={0.7} strokeWidth={1} />
      ))}

      <g clipPath="url(#land-clip)">
        {/* Lake (Ambrosia) */}
        <ellipse cx={240} cy={420} rx={70} ry={40} fill="#0d0a1f" stroke="#22d3ee" strokeOpacity={0.35} />
        {/* Wetland strokes (Grassrivers) */}
        <g stroke="#2dd4bf" strokeOpacity={0.25} strokeWidth={1.5} fill="none">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M${330 + (i % 3) * 40},${530 + i * 12} q10,-6 20,0 t20,0`} />
          ))}
        </g>
        {/* Mountains (Mount Kalaga) */}
        <path d="M380,125 l18,-30 l18,30 M405,125 l22,-38 l22,38 M440,125 l15,-24 l15,24" stroke="#c4b5fd" strokeOpacity={0.35} fill="none" />
        {/* Highways */}
        <g filter="url(#glow)" fill="none" stroke="#ec4899" strokeWidth={2} strokeOpacity={0.75}>
          {HIGHWAYS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        {/* City lights */}
        <g filter="url(#glow)">
          {LIGHTS.map((light, i) => (
            <circle key={i} {...light} />
          ))}
        </g>
      </g>
      {/* Overseas highway continues across the Keys */}
      <path d="M320,665 L170,672" stroke="#ec4899" strokeWidth={1.5} strokeOpacity={0.6} strokeDasharray="4 4" filter="url(#glow)" />

      <text x={190} y={520} textAnchor="middle" fill="#ede9fe" fillOpacity={0.18} fontSize={30} letterSpacing={14} fontWeight={600}>
        LEONIDA
      </text>
    </svg>
  );
}
