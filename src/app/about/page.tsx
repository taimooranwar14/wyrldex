import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { brand } from "@/lib/brand";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:h-dvh lg:grid-cols-[13rem_1fr_22rem] lg:grid-rows-[auto_1fr_auto]">
      <TopBar />
      <Sidebar activeHref="/about" />
      <main id="main" className="grid-lines flex-1 p-6 lg:col-span-2 lg:overflow-y-auto lg:p-10">
        <article className="max-w-2xl space-y-8 text-sm leading-relaxed text-muted">
          <header>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">About</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">{brand.name}</h1>
            <p className="mt-3 text-base">
              An unofficial explorer for Leonida, the state where Grand Theft Auto VI is set. Search the map, ask an AI
              that can only use one validated, read-only search tool, and inspect exactly what it did.
            </p>
          </header>

          <section>
            <h2 className="text-base font-semibold text-foreground">Where the data comes from</h2>
            <p className="mt-2">
              Region names come from Rockstar Games&apos; official GTA VI site; every location links to its source.
              Summaries are written in our own words, and the map is original artwork, so positions are illustrative,
              not in-game coordinates.
            </p>
            <ul className="mt-3 space-y-1">
              <li><span className="text-highlight">Officially confirmed</span>: named by Rockstar Games.</li>
              <li><span className="text-highlight">Community, unverified</span>: reported by players, not confirmed.</li>
              <li><span className="text-highlight">Sample data</span>: fictional placeholder for demos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">How the AI works</h2>
            <p className="mt-2">
              The model never touches the database. It can only <em>request</em> a search; the server checks the
              request against a whitelist and a schema, runs a read-only query, and hands back the results. The
              Execution Inspector shows every step with its timing.
            </p>
            <p className="mt-2">
              <strong className="text-foreground">This public demo runs no live AI.</strong> The answers you see are
              recordings of a real open-weight model (Qwen3 8B) running locally on the developer&apos;s machine, replayed
              at their original speed and labelled as recordings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Built with</h2>
            <p className="mt-2">Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Zod, Ollama, Vitest.</p>
          </section>
        </article>
      </main>
      <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted lg:col-span-3">
        {brand.disclaimer}
      </footer>
    </div>
  );
}
