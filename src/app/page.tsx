import { DetailPanel } from "@/components/detail-panel";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { sampleLocations } from "@/features/locations/sample-data";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    // Mobile: one stacked column. Desktop (lg): sidebar | map | details, filling the viewport.
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[13rem_1fr_22rem] lg:grid-rows-[auto_1fr_auto]">
      <TopBar />
      <Sidebar activeHref="/" />

      <main id="main" className="grid-lines relative min-h-[60vh] overflow-hidden lg:min-h-0">
        {/* Decorative preview pins; the interactive map arrives in M2. */}
        {sampleLocations.map((loc) => (
          <span
            key={loc.slug}
            aria-hidden
            className="absolute size-3 -translate-1/2 rounded-full bg-accent shadow-[0_0_16px_4px] shadow-accent/50"
            style={{ left: `${loc.x * 100}%`, top: `${loc.y * 100}%` }}
          />
        ))}
        <p className="absolute bottom-4 left-4 font-mono text-xs text-muted">
          Map preview — interactive map coming next
        </p>
      </main>

      <DetailPanel location={sampleLocations[0]} />

      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted lg:col-span-3">
        {brand.disclaimer}
      </footer>
    </div>
  );
}
