import { connection } from "next/server";
import { Suspense } from "react";
import { DetailPanel } from "@/components/detail-panel";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { Explorer } from "@/features/explorer/explorer";
import { listCharacters } from "@/features/graph/repository";
import { listLocations } from "@/features/locations/repository";
import { DEFAULT_WORLD_SLUG } from "@/features/locations/schema";
import { brand } from "@/lib/brand";

async function ExplorerWithData() {
  await connection(); // Query per request, never at build time, so builds and CI need no database.
  const [locations, characters] = await Promise.all([
    listLocations({ world: DEFAULT_WORLD_SLUG, limit: 100 }),
    listCharacters(DEFAULT_WORLD_SLUG),
  ]);
  // Live AI only when the developer opts in; everyone else gets the labelled recorded replay.
  return <Explorer locations={locations} characters={characters} liveAI={process.env.AI_MODE === "local"} />;
}

export default function Home() {
  return (
    // Mobile: one stacked column. Desktop (lg): sidebar | map | details, filling the viewport.
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[13rem_1fr_22rem] lg:grid-rows-[auto_1fr_auto]">
      <TopBar />
      <Sidebar activeHref="/" />
      <Suspense
        fallback={
          <>
            <main id="main" aria-busy="true" className="grid-lines flex flex-1 items-center justify-center p-4">
              <p className="font-mono text-xs text-muted">Loading world…</p>
            </main>
            <DetailPanel location={null} />
          </>
        }
      >
        <ExplorerWithData />
      </Suspense>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted lg:col-span-3">
        {brand.disclaimer}
      </footer>
    </div>
  );
}
