import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { Explorer } from "@/features/explorer/explorer";
import { sampleLocations } from "@/features/locations/sample-data";
import { brand } from "@/lib/brand";

export default function Home() {
  return (
    // Mobile: one stacked column. Desktop (lg): sidebar | map | details, filling the viewport.
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[13rem_1fr_22rem] lg:grid-rows-[auto_1fr_auto]">
      <TopBar />
      <Sidebar activeHref="/" />
      <Explorer locations={sampleLocations} />
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted lg:col-span-3">
        {brand.disclaimer}
      </footer>
    </div>
  );
}
